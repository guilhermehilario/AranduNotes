#!/usr/bin/env node

/**
 * Migracao automatica para Supabase (PostgreSQL via PgBouncer).
 *
 * O Prisma CLI (prisma migrate deploy / prisma db push) nao funciona com
 * PgBouncer em modo transacao porque usa prepared statements internamente.
 * Este script le os arquivos SQL das migrations do diretorio
 * prisma/migrations/, verifica quais ja foram aplicadas consultando a tabela
 * _prisma_migrations, e executa as pendentes usando o driver pg direto.
 *
 * Uso:
 *   node scripts/migrate-supabase.js
 *
 * Variaveis de ambiente necessarias:
 *   DATABASE_URL  — connection string do Supabase (com ?pgbouncer=true)
 */

const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// Carrega .env
function loadEnv() {
  const candidates = [
    path.resolve(__dirname, "../.env"),
    path.resolve(__dirname, "../../.env"),
  ];
  for (const envPath of candidates) {
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, "utf8");
      envContent.split("\n").forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) return;
        const eqIdx = trimmed.indexOf("=");
        if (eqIdx === -1) return;
        const key = trimmed.slice(0, eqIdx).trim();
        const val = trimmed.slice(eqIdx + 1).trim();
        if (!process.env[key]) process.env[key] = val;
      });
      return;
    }
  }
}

loadEnv();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL nao definida.");
  process.exit(1);
}

const MIGRATIONS_DIR = path.resolve(__dirname, "../prisma/migrations");

function log(msg) {
  const ts = new Date().toISOString();
  console.log(`[${ts}] ${msg}`);
}

/**
 * Le e ordena as migrations por nome de pasta (timestamp).
 */
function getMigrationDirs() {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    return [];
  }

  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((d) => {
      const sqlPath = path.join(MIGRATIONS_DIR, d, "migration.sql");
      return (
        fs.statSync(path.join(MIGRATIONS_DIR, d)).isDirectory() &&
        fs.existsSync(sqlPath)
      );
    })
    .sort()
    .map((d) => ({
      name: d,
      sqlPath: path.join(MIGRATIONS_DIR, d, "migration.sql"),
      hash: crypto
        .createHash("sha256")
        .update(
          fs.readFileSync(
            path.join(MIGRATIONS_DIR, d, "migration.sql"),
            "utf8",
          ),
        )
        .digest("hex"),
    }));
}

/**
 * Cria a tabela _prisma_migrations se nao existir.
 */
async function ensureMigrationsTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
      "id"                      TEXT NOT NULL PRIMARY KEY,
      "checksum"                TEXT NOT NULL,
      "finished_at"             TIMESTAMP(3),
      "migration_name"          TEXT NOT NULL UNIQUE,
      "logs"                    TEXT,
      "rolled_back_at"          TIMESTAMP(3),
      "started_at"              TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "applied_steps_count"     INTEGER NOT NULL DEFAULT 0
    );
  `);
}

/**
 * Retorna os nomes das migrations ja aplicadas.
 */
async function getAppliedMigrations(client) {
  const result = await client.query(
    `SELECT "migration_name" FROM "_prisma_migrations" WHERE "rolled_back_at" IS NULL ORDER BY "started_at"`,
  );
  return new Set(result.rows.map((r) => r.migration_name));
}

/**
 * Registra o inicio de uma migration.
 */
async function startMigration(client, id, name, hash) {
  await client.query(
    `INSERT INTO "_prisma_migrations" ("id", "checksum", "migration_name", "started_at") VALUES ($1, $2, $3, NOW()) ON CONFLICT ("migration_name") DO NOTHING`,
    [id, hash, name],
  );
}

/**
 * Marca uma migration como concluida.
 */
async function completeMigration(client, id) {
  await client.query(
    `UPDATE "_prisma_migrations" SET "finished_at" = NOW(), "applied_steps_count" = 1 WHERE "id" = $1`,
    [id],
  );
}

/**
 * Registra erro numa migration.
 */
async function failMigration(client, id, error) {
  await client.query(
    `UPDATE "_prisma_migrations" SET "logs" = $1 WHERE "id" = $2`,
    [error, id],
  );
}

/**
 * Detecta se uma migration usa sintaxe SQLite (PRAGMA, DATETIME, etc.)
 * e deve ser ignorada no PostgreSQL.
 */
function isSqliteMigration(sqlPath) {
  const content = fs.readFileSync(sqlPath, "utf8");
  return (
    content.includes("PRAGMA") ||
    content.includes("datetime('now')") ||
    content.includes("DATETIME") ||
    content.includes("AUTOINCREMENT")
  );
}

async function main() {
  log("🔄 Iniciando migracao Supabase...");

  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: DATABASE_URL.includes("supabase")
      ? { rejectUnauthorized: false }
      : undefined,
    max: 2,
  });

  const client = await pool.connect();

  try {
    // Garante que a tabela de migrations existe
    await ensureMigrationsTable(client);

    // Lista migrations do diretorio
    const migrations = getMigrationDirs();
    log(`📁 ${migrations.length} migrations encontradas no diretorio`);

    // Quais ja foram aplicadas
    const applied = await getAppliedMigrations(client);
    log(`✅ ${applied.size} migrations ja aplicadas`);

    // Filtra pendentes (exclui SQLite migrations ja marcadas como aplicadas)
    const pending = migrations.filter((m) => !applied.has(m.name));

    if (pending.length === 0) {
      log("✨ Banco de dados esta atualizado. Nenhuma migration pendente.");
      return;
    }

    // Separa SQLite migrations (so marca como aplicadas) de PostgreSQL migrations
    const sqlitePending = pending.filter((m) => isSqliteMigration(m.sqlPath));
    const pgPending = pending.filter((m) => !isSqliteMigration(m.sqlPath));

    // Marca SQLite migrations como aplicadas (baseline)
    for (const migration of sqlitePending) {
      const migrationId = crypto.randomUUID();
      await startMigration(client, migrationId, migration.name, migration.hash);
      await completeMigration(client, migrationId);
      log(`⏭️  ${migration.name} (SQLite — marcada como baseline)`);
    }

    if (pgPending.length === 0) {
      log(
        `\n✨ ${sqlitePending.length} migrations SQLite marcadas como baseline. Nenhuma migration PostgreSQL pendente.`,
      );
      return;
    }

    log(`⏳ ${pgPending.length} migration(s) PostgreSQL pendente(s):`);
    pgPending.forEach((m) => log(`   - ${m.name}`));

    // Executa cada migration PostgreSQL pendente
    for (const migration of pgPending) {
      log(`\n🚀 Aplicando: ${migration.name}`);

      const migrationId = crypto.randomUUID();
      const sql = fs.readFileSync(migration.sqlPath, "utf8");

      // Remove comentarios SQL (linhas que comecam com --)
      const cleanedSql = sql
        .split("\n")
        .filter((line) => !line.trim().startsWith("--"))
        .join("\n")
        .trim();

      if (!cleanedSql) {
        log(`   ⏭️  Migration vazia, pulando...`);
        await startMigration(
          client,
          migrationId,
          migration.name,
          migration.hash,
        );
        await completeMigration(client, migrationId);
        continue;
      }

      // Divide em statements
      const statements = cleanedSql
        .split(";")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      await startMigration(client, migrationId, migration.name, migration.hash);

      let successCount = 0;
      let errorCount = 0;

      for (const stmt of statements) {
        try {
          await client.query(stmt);
          successCount++;
        } catch (e) {
          errorCount++;
          const firstLine = stmt.split("\n")[0].substring(0, 80);
          log(`   ⚠️  Statement ignorado: ${firstLine}`);
          log(`      ${e.message.split("\n")[0]}`);
        }
      }

      if (errorCount > 0) {
        await failMigration(
          client,
          migrationId,
          `${successCount} OK, ${errorCount} erros`,
        );
        log(
          `   ⚠️  ${successCount} OK, ${errorCount} erros (statements ignorados)`,
        );
      } else {
        await completeMigration(client, migrationId);
        log(`   ✅ ${successCount} statements executados com sucesso`);
      }
    }

    log(
      `\n🎉 Migracao concluida! ${sqlitePending.length} baseline(s) + ${pgPending.length} migration(s) processada(s).`,
    );
  } catch (e) {
    log(`\n❌ Erro fatal na migracao: ${e.message}`);
    console.error(e);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
