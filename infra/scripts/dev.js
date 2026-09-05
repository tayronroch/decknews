const { spawn } = require('node:child_process')

const next = spawn('next', ['dev'], { stdio: 'inherit', shell: true })

let shuttingDown = false

function shutdown() {
  if (shuttingDown) return
  shuttingDown = true

  spawn('pnpm', ['run', 'services:stop'], { stdio: 'inherit', shell: true })
  next.kill('SIGINT')
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

next.on('exit', (code) => process.exit(code ?? 0))
