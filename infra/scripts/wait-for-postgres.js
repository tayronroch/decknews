const { exec } = require('node:child_process')

function checkPostgres() {
  exec(
    'docker exec decknews-dev-postgres pg_isready --host localhost',
    handleResult
  )

  function handleResult(error, stdout) {
    if (!stdout || stdout.search('accepting connections') === -1) {
      process.stdout.write('.')
      setTimeout(checkPostgres, 250)
      return
    }
    console.log('\n\n🟢 PostgreSQL está pronto para conexões!\n')
  }
}

process.stdout.write('\n🔴 Aguardando o PostgreSQL aceitar conexões...')
checkPostgres()
