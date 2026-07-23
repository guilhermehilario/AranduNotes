#!/usr/bin/env node

const { spawn } = require('node:child_process')
const fs = require('node:fs')

const env = { ...process.env }
const startedAt = Date.now()

function log(level, msg) {
  const ts = new Date().toISOString()
  console[level](`[${ts}] [ENTRYPOINT] ${msg}`)
}

;(async() => {
  // ────────────────────────────────────────────────────────────────
  // Verifica se é o comando do servidor web
  // ────────────────────────────────────────────────────────────────
  const cmd = process.argv.slice(2).join(' ');
  const isWebServer = cmd.includes('dist/main.js') || cmd.includes('npm run start');

  if (isWebServer) {
    log('log', 'Iniciando migrações do Prisma...');

    try {
      await exec('cd apps/api && npx prisma migrate deploy', { timeout: 60000 });
      log('log', '✅ Migrações aplicadas com sucesso');
    } catch (err) {
      // ⚠️ Falha na migração NÃO deve impedir o app de iniciar.
      // Fly.io pode reiniciar a máquina se o processo falhar,
      // então preferimos iniciar mesmo sem migração e logar o erro.
      log('error', `❌ Falha ao aplicar migrações: ${err.message}`);
      log('warn', '⚠️ O servidor vai iniciar mesmo assim. A migração pode estar em andamento ou o volume ainda não está pronto.');

      // Tenta uma segunda vez após 5 segundos (em background, sem travar o startup)
      setTimeout(async () => {
        try {
          log('log', '🔄 Tentando migração novamente em background...');
          await exec('cd apps/api && npx prisma migrate deploy', { timeout: 60000 });
          log('log', '✅ Migrações aplicadas com sucesso (2ª tentativa)');
        } catch (retryErr) {
          log('error', `❌ Migração falhou novamente em background: ${retryErr.message}`);
        }
      }, 5000);
    }
  }

  // ────────────────────────────────────────────────────────────────
  // Inicia a aplicação
  // ────────────────────────────────────────────────────────────────
  const launchCmd = process.argv.slice(2).join(' ');
  log('log', `Iniciando aplicação: ${launchCmd}`);

  if (process.env.BUCKET_NAME && fs.existsSync('/app/litestream.yml')) {
    log('log', 'Litestream configurado — executando com replicação');
    await exec(`litestream replicate -config litestream.yml -exec ${JSON.stringify(launchCmd)}`);
  } else {
    await exec(launchCmd);
  }
})().catch((err) => {
  log('error', `Falha fatal no entrypoint: ${err.message}`);
  log('error', `Tempo até a falha: ${Date.now() - startedAt}ms`);
  process.exit(1);
});

function exec(command, opts = {}) {
  const child = spawn(command, { shell: true, stdio: 'inherit', env });
  const timeout = opts.timeout || 0;

  return new Promise((resolve, reject) => {
    let timedOut = false;

    if (timeout > 0) {
      setTimeout(() => {
        timedOut = true;
        child.kill('SIGTERM');
        reject(new Error(`${command} timed out after ${timeout}ms`));
      }, timeout);
    }

    child.on('exit', (code) => {
      if (timedOut) return;
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${command} failed rc=${code}`));
      }
    });

    child.on('error', (err) => {
      if (timedOut) return;
      reject(new Error(`${command} error: ${err.message}`));
    });
  });
}
