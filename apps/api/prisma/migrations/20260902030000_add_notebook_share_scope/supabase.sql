-- ============================================================
-- Supabase (PostgreSQL) — Migration: compartilhamento por folha
-- Execute no SQL Editor do Supabase (28/…). Idempotente.
-- ============================================================

-- Pré-requisito: a tabela Share (compartilhamentos) pode não existir
-- se esta migration rodar em um ambiente novo. Garantimos a criação
-- apenas se ausente (sem impacto nos ambientes já migrados).
CREATE TABLE IF NOT EXISTS "Share" (
    "id"               TEXT      NOT NULL,
    "resourceType"     TEXT      NOT NULL,
    "resourceId"       TEXT      NOT NULL,
    "ownerId"          TEXT      NOT NULL,
    "sharedWithUserId" TEXT      NOT NULL,
    "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Share_pkey" PRIMARY KEY ("id")
);

-- Nova tabela: escopo de folhas por compartilhamento de caderno.
-- Sem registros para um Share => acesso a todas as folhas do caderno.
CREATE TABLE IF NOT EXISTS "NotebookShareScope" (
    "id"        TEXT      NOT NULL,
    "shareId"   TEXT      NOT NULL,
    "leafId"    TEXT      NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NotebookShareScope_pkey" PRIMARY KEY ("id")
);

-- Índices
CREATE UNIQUE INDEX IF NOT EXISTS "NotebookShareScope_shareId_leafId_key"
    ON "NotebookShareScope"("shareId", "leafId");
CREATE INDEX IF NOT EXISTS "NotebookShareScope_shareId_idx"
    ON "NotebookShareScope"("shareId");
CREATE INDEX IF NOT EXISTS "NotebookShareScope_leafId_idx"
    ON "NotebookShareScope"("leafId");

-- Foreign Keys
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'NotebookShareScope_shareId_fkey') THEN
        ALTER TABLE "NotebookShareScope"
            ADD CONSTRAINT "NotebookShareScope_shareId_fkey"
            FOREIGN KEY ("shareId") REFERENCES "Share"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'NotebookShareScope_leafId_fkey') THEN
        ALTER TABLE "NotebookShareScope"
            ADD CONSTRAINT "NotebookShareScope_leafId_fkey"
            FOREIGN KEY ("leafId") REFERENCES "Leaf"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Índices da tabela Share (se ela acabou de ser criada)
CREATE UNIQUE INDEX IF NOT EXISTS "Share_resourceType_resourceId_sharedWithUserId_key"
    ON "Share"("resourceType", "resourceId", "sharedWithUserId");
CREATE INDEX IF NOT EXISTS "Share_sharedWithUserId_idx" ON "Share"("sharedWithUserId");
CREATE INDEX IF NOT EXISTS "Share_resourceType_resourceId_idx" ON "Share"("resourceType", "resourceId");
