const fs = require('node:fs')
const path = require('node:path')

const ROOT_DIR = path.resolve(__dirname, '../..')

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

for (const rule of VIOLATIONS) {
  for (const relativeFile of rule.files) {
    const fullPath = path.join(ROOT_DIR, relativeFile)
    if (!fs.existsSync(fullPath)) continue

    const content = fs.readFileSync(fullPath, 'utf8')
    const match = content.match(rule.pattern)

    if (match) {
      console.error(
        `\n [GitGuardian Guard] Security violation in ${relativeFile}:`
      )
      console.error(`   ${rule.description}`)
      console.error(`   Matched line: "${match[0].trim()}"\n`)
      hasErrors = true
    }
  }
}

if (hasErrors) {
  process.exit(1)
}
