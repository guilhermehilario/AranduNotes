-- Baseline idempotente para PostgreSQL (Supabase)
-- As tabelas de questões/simulados foram originalmente criadas na migration
-- 20260709192603_add_email_verification, que usa sintaxe SQLite e é
-- marcada como "baseline" (nunca executada) pelo migrate-supabase.js.
-- Logo, em um banco PostgreSQL de produção essas tabelas podem NÃO existir.
-- Este arquivo garante a existência delas, de forma idempotente.
-- ATENÇÃO: não usar palavras-chave de sintaxe SQLite neste arquivo, pois o
-- classificador do migrate-supabase.js as detectaria e ignoraria a migration.

-- Garante colunas que já deveriam existir (migrations PostgreSQL anteriores)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "theme" TEXT NOT NULL DEFAULT 'system';
ALTER TABLE "Question" ADD COLUMN IF NOT EXISTS "theme" TEXT;

-- CreateTable (idempotente) — Questões
CREATE TABLE IF NOT EXISTS "Question" (
    "id" TEXT NOT NULL,
    "leafId" TEXT,
    "notebookId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "options" TEXT NOT NULL DEFAULT '[]',
    "correctAnswer" TEXT NOT NULL,
    "explanation" TEXT,
    "questionType" TEXT NOT NULL DEFAULT 'multiple_choice',
    "theme" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable (idempotente) — Simulados
CREATE TABLE IF NOT EXISTS "MockExam" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "notebookId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "timeLimit" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MockExam_pkey" PRIMARY KEY ("id")
);

-- CreateTable (idempotente) — Relação N:N Simulado x Questão
CREATE TABLE IF NOT EXISTS "MockExamQuestion" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "MockExamQuestion_pkey" PRIMARY KEY ("id")
);

-- Foreign keys (idempotentes — podem já existir em bancos criados corretamente)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Question_notebookId_fkey') THEN
        ALTER TABLE "Question" ADD CONSTRAINT "Question_notebookId_fkey" FOREIGN KEY ("notebookId") REFERENCES "Notebook"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Question_leafId_fkey') THEN
        ALTER TABLE "Question" ADD CONSTRAINT "Question_leafId_fkey" FOREIGN KEY ("leafId") REFERENCES "Leaf"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Question_userId_fkey') THEN
        ALTER TABLE "Question" ADD CONSTRAINT "Question_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'MockExam_notebookId_fkey') THEN
        ALTER TABLE "MockExam" ADD CONSTRAINT "MockExam_notebookId_fkey" FOREIGN KEY ("notebookId") REFERENCES "Notebook"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'MockExam_userId_fkey') THEN
        ALTER TABLE "MockExam" ADD CONSTRAINT "MockExam_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'MockExamQuestion_examId_fkey') THEN
        ALTER TABLE "MockExamQuestion" ADD CONSTRAINT "MockExamQuestion_examId_fkey" FOREIGN KEY ("examId") REFERENCES "MockExam"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'MockExamQuestion_questionId_fkey') THEN
        ALTER TABLE "MockExamQuestion" ADD CONSTRAINT "MockExamQuestion_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Unique index (relação N:N)
CREATE UNIQUE INDEX IF NOT EXISTS "MockExamQuestion_examId_questionId_key" ON "MockExamQuestion"("examId", "questionId");