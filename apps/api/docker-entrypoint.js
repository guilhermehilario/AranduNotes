#!/usr/bin/env node

const { spawn } = require('node:child_process')

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
      await exec('npx prisma migrate deploy', { timeout: 60000 });
      log('log', '✅ Migrações aplicadas com sucesso');
    } catch (err) {
      log('error', `❌ Falha ao aplicar migrações: ${err.message}`);
      log('warn', '⚠️ O servidor vai iniciar mesmo assim.');

      setTimeout(async () => {
        try {
          log('log', '🔄 Tentando migração novamente em background...');
          await exec('npx prisma migrate deploy', { timeout: 60000 });
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

  await exec(launchCmd);
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
