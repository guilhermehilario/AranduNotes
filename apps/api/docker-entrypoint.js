#!/usr/bin/env node

const { spawn } = require('node:child_process')
const fs = require('node:fs')

const env = { ...process.env }

;(async() => {
  // If running the web server then migrate existing database
  // Se for iniciar o servidor web (qualquer comando que contenha dist/main.js),
  // executa as migrações do Prisma antes de iniciar.
  const cmd = process.argv.slice(2).join(' ');
  if (cmd.includes('dist/main.js') || cmd.includes('npm run start')) {
    await exec('npx prisma migrate deploy')
  }

  // launch application
  if (process.env.BUCKET_NAME && fs.existsSync('/app/litestream.yml')) {
    await exec(`litestream replicate -config litestream.yml -exec ${JSON.stringify(process.argv.slice(2).join(' '))}`)
  } else {
    await exec(process.argv.slice(2).join(' '))
  }
})()

function exec(command) {
  const child = spawn(command, { shell: true, stdio: 'inherit', env })
  return new Promise((resolve, reject) => {
    child.on('exit', code => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`${command} failed rc=${code}`))
      }
    })
  })
}
