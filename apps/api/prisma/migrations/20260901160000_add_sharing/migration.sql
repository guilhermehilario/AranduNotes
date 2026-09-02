-- Compartilhamento e acesso público (20260901160000_add_sharing)

-- Gatilho de acesso: isPublic + publicToken (link sem login)
ALTER TABLE "Notebook" ADD COLUMN "isPublic" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Notebook" ADD COLUMN "publicToken" TEXT;
CREATE UNIQUE INDEX "Notebook_publicToken_key" ON "Notebook"("publicToken");

ALTER TABLE "Leaf" ADD COLUMN "isPublic" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Leaf" ADD COLUMN "publicToken" TEXT;
CREATE UNIQUE INDEX "Leaf_publicToken_key" ON "Leaf"("publicToken");

ALTER TABLE "Question" ADD COLUMN "isPublic" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Question" ADD COLUMN "publicToken" TEXT;
CREATE UNIQUE INDEX "Question_publicToken_key" ON "Question"("publicToken");

ALTER TABLE "MockExam" ADD COLUMN "isPublic" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "MockExam" ADD COLUMN "publicToken" TEXT;
CREATE UNIQUE INDEX "MockExam_publicToken_key" ON "MockExam"("publicToken");

ALTER TABLE "Flashcard" ADD COLUMN "isPublic" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Flashcard" ADD COLUMN "publicToken" TEXT;
CREATE UNIQUE INDEX "Flashcard_publicToken_key" ON "Flashcard"("publicToken");

-- Compartilhamentos entre usuários
CREATE TABLE "Share" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "sharedWithUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Share_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Share_sharedWithUserId_fkey" FOREIGN KEY ("sharedWithUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Share_resourceType_resourceId_sharedWithUserId_key" UNIQUE ("resourceType", "resourceId", "sharedWithUserId")
);

CREATE INDEX "Share_sharedWithUserId_idx" ON "Share"("sharedWithUserId");
CREATE INDEX "Share_resourceType_resourceId_idx" ON "Share"("resourceType", "resourceId");