-- ============================================================
-- Supabase (PostgreSQL) — Migration: amigos, presença e chat
-- Execute no SQL Editor do Supabase (…). Idempotente.
--
-- Cobre: colunas de presença/status no User, código de amigo,
-- tabelas Friend / FriendRequest / DirectMessage e seus índices.
-- ============================================================

-- ── User: presença (status manual + heartbeats) ─────────────────────────
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'available';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastActiveAt" TIMESTAMP(3);

-- ── User: código único de amigo (alternativa ao e-mail) ────────────────
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "friendCode" TEXT;

-- ── Amigos (relação bidirecional: 2 linhas por amizade) ──────────────────
CREATE TABLE IF NOT EXISTS "Friend" (
    "id"        TEXT NOT NULL,
    "ownerId"   TEXT NOT NULL,
    "friendId"  TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Friend_pkey" PRIMARY KEY ("id")
);

-- ── Solicitações de amizade ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "FriendRequest" (
    "id"          TEXT NOT NULL,
    "senderId"    TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "status"      TEXT NOT NULL DEFAULT 'pending',
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL,
    CONSTRAINT "FriendRequest_pkey" PRIMARY KEY ("id")
);

-- ── Mensagens diretas ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "DirectMessage" (
    "id"          TEXT NOT NULL,
    "senderId"    TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "contentType" TEXT NOT NULL DEFAULT 'text',
    "content"     TEXT NOT NULL,
    "contentRef"  TEXT,
    "readAt"      TIMESTAMP(3),
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DirectMessage_pkey" PRIMARY KEY ("id")
);

-- ── Índices ───────────────────────────────────────────────────────────────

CREATE UNIQUE INDEX IF NOT EXISTS "User_friendCode_key" ON "User"("friendCode");
CREATE INDEX IF NOT EXISTS "User_status_idx" ON "User"("status");

CREATE INDEX IF NOT EXISTS "Friend_friendId_idx" ON "Friend"("friendId");
CREATE UNIQUE INDEX IF NOT EXISTS "Friend_ownerId_friendId_key" ON "Friend"("ownerId", "friendId");
CREATE INDEX IF NOT EXISTS "Friend_ownerId_idx" ON "Friend"("ownerId");

CREATE INDEX IF NOT EXISTS "FriendRequest_recipientId_status_idx" ON "FriendRequest"("recipientId", "status");
CREATE UNIQUE INDEX IF NOT EXISTS "FriendRequest_senderId_recipientId_key" ON "FriendRequest"("senderId", "recipientId");
CREATE INDEX IF NOT EXISTS "FriendRequest_senderId_idx" ON "FriendRequest"("senderId");

CREATE INDEX IF NOT EXISTS "DirectMessage_senderId_recipientId_createdAt_idx" ON "DirectMessage"("senderId", "recipientId", "createdAt");
CREATE INDEX IF NOT EXISTS "DirectMessage_recipientId_readAt_idx" ON "DirectMessage"("recipientId", "readAt");

-- ── Foreign Keys ──────────────────────────────────────────────────────────
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Friend_ownerId_fkey') THEN
        ALTER TABLE "Friend" ADD CONSTRAINT "Friend_ownerId_fkey"
            FOREIGN KEY ("ownerId") REFERENCES "User"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Friend_friendId_fkey') THEN
        ALTER TABLE "Friend" ADD CONSTRAINT "Friend_friendId_fkey"
            FOREIGN KEY ("friendId") REFERENCES "User"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FriendRequest_senderId_fkey') THEN
        ALTER TABLE "FriendRequest" ADD CONSTRAINT "FriendRequest_senderId_fkey"
            FOREIGN KEY ("senderId") REFERENCES "User"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FriendRequest_recipientId_fkey') THEN
        ALTER TABLE "FriendRequest" ADD CONSTRAINT "FriendRequest_recipientId_fkey"
            FOREIGN KEY ("recipientId") REFERENCES "User"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'DirectMessage_senderId_fkey') THEN
        ALTER TABLE "DirectMessage" ADD CONSTRAINT "DirectMessage_senderId_fkey"
            FOREIGN KEY ("senderId") REFERENCES "User"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'DirectMessage_recipientId_fkey') THEN
        ALTER TABLE "DirectMessage" ADD CONSTRAINT "DirectMessage_recipientId_fkey"
            FOREIGN KEY ("recipientId") REFERENCES "User"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
