const fs = require('node:fs')
const path = require('node:path')

const ROOT_DIR = path.resolve(__dirname, '../..')

const SECRET_ENV_KEYS = [
  'DATABASE_URL',
  'PASSWORD_PEPPER',
  'PASSWORD_PEPPER_PREVIOUS',
]

const VIOLATIONS = [
  {
    pattern: /^[A-Z0-9_]*PASSWORD=(?!\s*($|#|\${|<)).+/m,
    files: ['.env.example'],
    description:
      'Found populated password in example env file. Leave password empty or use placeholder.',
  },
  {
    pattern: /postgresql:\/\/(?!(\${|<))[^:]+:(?!(\${|<))[^@]+@/m,
    files: ['.env.example'],
    description:
      'Found hardcoded credentials in database connection string. Use template ${POSTGRES_USER}:${POSTGRES_PASSWORD} instead.',
  },
  {
    pattern: /[A-Z0-9_]*PASSWORD:\s*\${[A-Z0-9_]+:-[^}\s]+}/m,
    files: ['infra/compose.yaml', 'docker-compose.yaml', 'docker-compose.yml'],
    description:
      'Found hardcoded fallback password in Docker Compose. Use env_file or ${VAR} without default secret fallback.',
  },
]

let hasErrors = false

function reportViolation(relativeFile, description, matchedLine) {
  console.error(`\n [GitGuardian Guard] Security violation in ${relativeFile}:`)
  console.error(`   ${description}`)
  if (matchedLine) {
    console.error(`   Matched line: "${matchedLine.trim()}"`)
  }
  console.error()
  hasErrors = true
}

for (const rule of VIOLATIONS) {
  for (const relativeFile of rule.files) {
    const fullPath = path.join(ROOT_DIR, relativeFile)
    if (!fs.existsSync(fullPath)) continue

    const content = fs.readFileSync(fullPath, 'utf8')
    const match = content.match(rule.pattern)

    if (match) {
      reportViolation(relativeFile, rule.description, match[0])
    }
  }
}

const dockerignorePath = path.join(ROOT_DIR, '.dockerignore')
const dockerignore = fs.readFileSync(dockerignorePath, 'utf8')
for (const requiredRule of ['.env', '.env.*', '!.env.example']) {
  if (!dockerignore.split(/\r?\n/).includes(requiredRule)) {
    reportViolation(
      '.dockerignore',
      `Missing required environment-file rule: ${requiredRule}`
    )
  }
}

const dockerfilePath = path.join(ROOT_DIR, 'Dockerfile')
const dockerfile = fs.readFileSync(dockerfilePath, 'utf8')
const runnerStageIndex = dockerfile.indexOf(' AS runner')
const runnerStage =
  runnerStageIndex === -1 ? '' : dockerfile.slice(runnerStageIndex)

if (runnerStageIndex === -1) {
  reportViolation('Dockerfile', 'Missing a dedicated runner stage.')
} else if (/COPY[^\n]*\.env(?:\.[^\s]+)?(?:\s|$)/m.test(runnerStage)) {
  reportViolation(
    'Dockerfile',
    'The production runner stage must not copy environment files.'
  )
}

function listSourceFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name)
    if (entry.isDirectory()) {
      return listSourceFiles(fullPath)
    }
    return /\.(?:ts|tsx)$/.test(entry.name) ? [fullPath] : []
  })
}

const clientDirective = /^\s*['"]use client['"];?/m
const serverEnvironmentImport =
  /(?:from\s*|import\s*\()['"]@\/lib\/env\/server['"]/m
const publicSecretReference = new RegExp(
  `NEXT_PUBLIC_(?:${SECRET_ENV_KEYS.join('|')})`,
  'm'
)

for (const sourceFile of listSourceFiles(path.join(ROOT_DIR, 'src'))) {
  if (sourceFile.endsWith('.spec.ts') || sourceFile.endsWith('.test.ts')) {
    continue
  }

  const content = fs.readFileSync(sourceFile, 'utf8')
  const relativeFile = path.relative(ROOT_DIR, sourceFile)

  if (clientDirective.test(content) && serverEnvironmentImport.test(content)) {
    reportViolation(
      relativeFile,
      'Client Components must not import the server environment module.'
    )
  }

  const publicSecret = content.match(publicSecretReference)
  if (publicSecret) {
    reportViolation(
      relativeFile,
      'Secrets must never use the NEXT_PUBLIC_ prefix.',
      publicSecret[0]
    )
  }
}

if (hasErrors) {
  process.exit(1)
}
