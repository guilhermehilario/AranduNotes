#!/usr/bin/env node

/**
 * Auditoria do banco PostgreSQL (Supabase) vs. schema esperado pelo Prisma.
 *
 * Verifica se as tabelas essenciais existem e se as migrations estão
 * registradas em _prisma_migrations, apontando divergências — ex.: tabelas
 * criadas apenas em migrations "SQLite" (baseline) que nunca rodam em prod.
 *
 * Uso:
 *   DATABASE_URL="postgresql://..." node scripts/check-supabase.js
 *
 * A DATABASE_URL também é lida de .env/apps/api ou .env do monorepo.
 */

const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

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
  console.error("❌ DATABASE_URL não definida.");
  process.exit(1);
}

/**
 * Monta a configuração SSL do pg (mesma lógica do migrate-supabase.js):
 * - sslmode=disable => sem TLS
 * - PGSSLROOTCERT => valida contra a CA/chain informada (ex.: CA privada da
 *   Supabase na conexão direta) sem desativar a validação
 * - default => sslmode=require contra o trust store do sistema
 */
function buildSslConfig(urlWantsDisable) {
  if (urlWantsDisable) return undefined;

  if (process.env.PGSSLROOTCERT) {
    const ca = fs.readFileSync(process.env.PGSSLROOTCERT, "utf8");
    return { rejectUnauthorized: true, ca };
  }

  return { rejectUnauthorized: true };
}

// Tabelas esperadas pelo schema.prisma (entidades principais)
const EXPECTED_TABLES = [
  "User",
  "Notebook",
  "Leaf",
  "Flashcard",
  "Question",
  "MockExam",
  "MockExamQuestion",
  "MockExamAttempt",
  "ReviewLog",
  "StudySession",
  "Bookmark",
  "Tag",
  "LeafTag",
  "Event",
  "Goal",
  "PomodoroSession",
  "Todo",
  "EditHistory",
  "RefreshToken",
];

// Migrations que usam sintaxe SQLite e são marcadas como baseline em prod
const BASELINED_MIGRATIONS = [
  "20260703144524_init",
  "20260706210315_add_tags_bookmarks_subleaves",
  "20260706211149_add_trash_edit_history",
  "20260707144838_add_archived_at",
  "20260709192603_add_email_verification",
  "20260709195555_add_password_reset",
  "20260722161303_add_terms_acceptance",
  "20260722171729_add_deleted_at_user",
  "20260724124800_add_deleted_at_flashcard",
  "20260729204007_add_review_log",
  "20260803120000_add_refresh_token_rotation",
];

async function main() {
  const dbUrl = new URL(DATABASE_URL);
  const urlWantsDisable = dbUrl.searchParams.get("sslmode") === "disable";
  // O TLS é controlado pela opção `ssl` do Pool (buildSslConfig). Remover o
  // parâmetro da URL evita que o pg-connection-string monte uma config SSL
  // própria e sobrescreva a nossa (incl. `ca` quando PGSSLROOTCERT).
  dbUrl.searchParams.delete("sslmode");

  const pool = new Pool({
    connectionString: dbUrl.toString(),
    ssl: buildSslConfig(urlWantsDisable),
    max: 2,
  });

  const client = await pool.connect();

  try {
    // 1. Tabelas existentes
    const tablesRes = await client.query(
      `SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`,
    );
    const existing = new Set(tablesRes.rows.map((r) => r.tablename));

    // 2. Migrations aplicadas/registradas
    const migrationsRes = await client.query(
      `SELECT migration_name, finished_at, rolled_back_at
       FROM _prisma_migrations ORDER BY started_at`,
    ).catch(() => null);

    const applied = new Set(
      (migrationsRes?.rows ?? []).map((r) => r.migration_name),
    );

    console.log(`\n📋 Tabelas (${existing.size} encontradas):`);
    for (const table of EXPECTED_TABLES) {
      if (existing.has(table)) {
        console.log(`   ✅ ${table}`);
      } else {
        console.log(`   ❌ ${table} — AUSENTE`);
      }
    }

    const extra = [...existing].filter((t) => !EXPECTED_TABLES.includes(t));
    if (extra.length) {
      console.log(`\n   Extra (não mapeadas): ${extra.join(", ")}`);
    }

    if (!migrationsRes) {
      console.log("\n⚠️  Tabela _prisma_migrations não existe (banco pode ter sido criado manualmente ou via db push).");
    } else {
      console.log(`\n🧾 Migrations registradas (${applied.size}):`);
      for (const m of migrationsRes.rows) {
        const status = m.rolled_back_at
          ? "rolled_back"
          : m.finished_at
            ? "finished"
            : "started?";
        const baseline = BASELINED_MIGRATIONS.includes(m.migration_name)
          ? " [BASELINE-SQLite]"
          : "";
        console.log(`   ${status.padEnd(9)} ${m.migration_name}${baseline}`);
      }

      const missingCritical = EXPECTED_TABLES.filter((t) => !existing.has(t));
      const missingCoreDb = BASELINED_MIGRATIONS.filter(
        (m) => !applied.has(m),
      );

      console.log("\n📝 Diagnóstico:");
      if (missingCoreDb.length) {
        console.log(`   ⚠️  ${missingCoreDb.length} migrations "SQLite" ainda NÃO registradas em prod (serão baselined no próximo deploy).`);
      } else {
        console.log("   ✅ Todas as migrations SQLite já foram baselined em prod.");
      }
      if (missingCritical.length) {
        console.log(`   ❌ Tabelas essenciais ausentes: ${missingCritical.join(", ")}`);
        console.log("      → A migration 20260901130000_ensure_study_schema cria essas");
        console.log("      tabelas de forma idempotente se rodar após o _prisma_migrations existir.");
      } else {
        console.log("   ✅ Todas as tabelas essenciais estão presentes.");
      }
    }

    console.log("\n✅ Auditoria concluída.");
  } catch (e) {
    console.error(`\n❌ Erro na auditoria: ${e.message}`);
    process.exitCode = 1;
  } finally {
    await client.release();
  }
  await pool.end();
}

main();