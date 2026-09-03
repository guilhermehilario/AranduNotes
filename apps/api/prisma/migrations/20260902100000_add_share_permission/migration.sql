-- Adiciona a coluna de permissão (visualizar vs editar) no Share.
-- Default de novas linhas: 'viewer'. Compartilhamentos existentes mantêm o
-- comportamento atual (edição), então são marcados como 'editor' de uma vez.
ALTER TABLE "Share" ADD COLUMN IF NOT EXISTS "permission" TEXT NOT NULL DEFAULT 'viewer';

UPDATE "Share" SET "permission" = 'editor' WHERE "permission" = 'viewer';
