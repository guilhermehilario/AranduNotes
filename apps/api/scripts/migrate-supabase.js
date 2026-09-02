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
 * Monta a configuração SSL do pg.
 *
 * - sslmode=disable => sem TLS (apenas testes locais)
 * - PGSSLROOTCERT (caminho para um PEM com a(s) CA(s) raiz/chain) => valida o
 *   certificado contra essa âncora, permitindo CAs privadas como a da Supabase
 *   (conexão direta db.<ref>.supabase.co) sem desativar a validação.
 * - default => sslmode=require com validação contra o trust store do sistema
 *   (compatível com o pooler do Supabase, que usa CA pública).
 */
function buildSslConfig(urlWantsDisable) {
  if (urlWantsDisable) return undefined;

  if (process.env.PGSSLROOTCERT) {
    const ca = fs.readFileSync(process.env.PGSSLROOTCERT, "utf8");
    return { rejectUnauthorized: true, ca };
  }

  return { rejectUnauthorized: true };
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
 * Cria a tabela _prisma_migrations se nao existir e a deixa em estado
 * utilizável (o startMigration usa ON CONFLICT em migration_name, que exige
 * uma constraint UNIQUE).
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

  // Auto-cura de tabelas antigas criadas sem UNIQUE: remove registros órfãos
  // (started sem finished) que duplicam uma linha já concluída da mesma
  // migration. São sobras de execuções abortadas; a linha concluída fica.
  await client.query(`
    DELETE FROM "_prisma_migrations" AS a
    USING "_prisma_migrations" AS b
    WHERE a."migration_name" = b."migration_name"
      AND a."finished_at" IS NULL
      AND b."finished_at" IS NOT NULL
  `);

  // Garante a constraint de unicidade (mesmo nome usado pelo `prisma migrate`),
  // exigida pelo ON CONFLICT do startMigration. Se ainda existir duplicata sem
  // linha concluída, a criação falhará de forma visível (não silenciosa).
  await client.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS "_prisma_migrations_migration_name_key"
    ON "_prisma_migrations"("migration_name")
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

/**
 * Divide um script SQL em statements individuais, ignorando o caractere ";" 
 * dentro de strings entre aspas simples e dentro de blocos $-quoted ($$...$$),
 * que aparecem em plpgsql (funções/procedures/blocos DO).
 */
function splitStatements(sql) {
  const statements = [];
  let current = "";
  let i = 0;
  const n = sql.length;

  while (i < n) {
    const ch = sql[i];

    // Comentário de linha (-- ...) até o fim da linha
    if (ch === "-" && sql[i + 1] === "-") {
      while (i < n && sql[i] !== "\n") {
        current += sql[i];
        i++;
      }
      continue;
    }

    // String entre aspas simples ('' = escape)
    if (ch === "'") {
      current += ch;
      i++;
      while (i < n) {
        if (sql[i] === "'") {
          current += sql[i];
          i++;
          if (sql[i] === "'") {
            // '' escapado
            current += sql[i];
            i++;
            continue;
          }
          break;
        }
        current += sql[i];
        i++;
      }
      continue;
    }

    // Bloco $-quoted ($$ ou $tag$)
    if (ch === "$") {
      const match = /^\$[A-Za-z0-9_]*\$/.exec(sql.slice(i));
      if (match) {
        const tag = match[0];
        current += tag;
        i += tag.length;
        const endTag = sql.indexOf(tag, i);
        if (endTag === -1) {
          current += sql.slice(i);
          i = n;
        } else {
          current += sql.slice(i, endTag + tag.length);
          i = endTag + tag.length;
        }
        continue;
      }
    }

    // Fim de statement
    if (ch === ";") {
      const trimmed = current.trim();
      if (trimmed.length > 0) statements.push(trimmed);
      current = "";
      i++;
      continue;
    }

    current += ch;
    i++;
  }

  const trimmed = current.trim();
  if (trimmed.length > 0) statements.push(trimmed);

  return statements;
}

async function main() {
  log("🔄 Iniciando migracao Supabase...");

  // 🔐 CRIT-3: SSL/TLS — usar sslmode=require para verificar certificado do servidor.
  // rejectUnauthorized: false permite MITM; sslmode=require valida o certificado
  // sem precisar do CA bundle (compatível com PgBouncer do Supabase).
  const dbUrl = new URL(DATABASE_URL);
  const urlWantsDisable = dbUrl.searchParams.get("sslmode") === "disable";
  // O TLS é controlado pela opção `ssl` do Pool (buildSslConfig). Remover o
  // parâmetro da URL evita que o pg-connection-string monte uma config SSL
  // própria (ssl: {}) e sobrescreva a nossa (incl. `ca` quando PGSSLROOTCERT).
  dbUrl.searchParams.delete("sslmode");

  const pool = new Pool({
    connectionString: dbUrl.toString(),
    ssl: buildSslConfig(urlWantsDisable),
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

      // Divide em statements, respeitando strings entre aspas simples e blocos
      // dollar-quoted ($$...$$) para não quebrar plpgsql (procedures/DO).
      const statements = splitStatements(cleanedSql);

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
