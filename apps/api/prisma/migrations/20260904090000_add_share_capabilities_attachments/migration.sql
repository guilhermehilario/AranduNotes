-- ============================================================
-- Capacidades de edição granular no Share + anexos de folha.
-- ============================================================

-- ── Share: colunas de capacidade (só têm efeito com permission='editor') ──
ALTER TABLE "Share" ADD COLUMN IF NOT EXISTS "canEditContent"  BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Share" ADD COLUMN IF NOT EXISTS "canCreateLeaves" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Share" ADD COLUMN IF NOT EXISTS "canUploadFiles"  BOOLEAN NOT NULL DEFAULT false;

-- Compartilhamentos 'editor' existentes passam a ter todas as capacidades,
-- preservando o comportamento atual (edição total) após o upgrade.
UPDATE "Share" SET "canEditContent" = true, "canCreateLeaves" = true, "canUploadFiles" = true
WHERE "permission" = 'editor';

-- ── LeafAttachment: arquivos anexados às folhas ──
CREATE TABLE IF NOT EXISTS "LeafAttachment" (
    "id"         TEXT    NOT NULL,
    "leafId"     TEXT    NOT NULL,
    "uploadedBy" TEXT    NOT NULL,
    "fileName"   TEXT    NOT NULL,
    "mimeType"   TEXT    NOT NULL,
    "size"       INTEGER NOT NULL,
    "data"       BLOB    NOT NULL,
    "createdAt"  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LeafAttachment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "LeafAttachment_leafId_idx" ON "LeafAttachment"("leafId");