/**
 * 🗄️ Script de migração de dados: db.json → SQLite (Prisma)
 *
 * Uso: npx tsx prisma/seed.ts
 */
import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import * as fs from 'fs';
import * as path from 'path';

const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL || 'file:./dev.db',
});
const prisma = new PrismaClient({ adapter });

const DEFAULT_TAGS = [
  { name: 'Importante', color: '#ef4444' },
  { name: 'Prova', color: '#f59e0b' },
  { name: 'ProvaFinal', color: '#aa3bff' },
  { name: 'Exercicios', color: '#10b981' },
  { name: 'Revisao', color: '#3b82f6' },
  { name: 'Professor', color: '#ec4899' },
];

async function main() {
  const dbJsonPath = path.join(process.cwd(), 'db.json');

  if (!fs.existsSync(dbJsonPath)) {
    console.log('⚠️  db.json não encontrado. Pulando migração de dados.');
    return;
  }

  const content = fs.readFileSync(dbJsonPath, 'utf8');
  const data = JSON.parse(content);

  // ── 0. Seed default tags for each user ──
  if (data.users?.length > 0) {
    for (const user of data.users) {
      for (const tag of DEFAULT_TAGS) {
        await prisma.tag.upsert({
          where: {
            userId_name: { userId: user.id, name: tag.name },
          },
          update: { color: tag.color },
          create: {
            userId: user.id,
            name: tag.name,
            color: tag.color,
          },
        });
      }
    }
    console.log(`✅ Tags padrão criadas para ${data.users.length} usuários`);
  }

  // ── 1. Migrar Users ──
  if (data.users?.length > 0) {
    for (const user of data.users) {
      await prisma.user.upsert({
        where: { id: user.id },
        update: {
          name: user.name,
          email: user.email,
          password: user.password,
          avatarUrl: user.avatarUrl,
        },
        create: {
          id: user.id,
          name: user.name,
          email: user.email,
          password: user.password,
          avatarUrl: user.avatarUrl,
          createdAt: new Date(user.createdAt),
          updatedAt: new Date(user.updatedAt),
        },
      });
    }
    console.log(`✅ Migrados ${data.users.length} usuários`);
  }

  // ── 2. Migrar Notebooks ──
  if (data.notebooks?.length > 0) {
    for (const nb of data.notebooks) {
      await prisma.notebook.upsert({
        where: { id: nb.id },
        update: {
          title: nb.title,
          description: nb.description,
          color: nb.color,
        },
        create: {
          id: nb.id,
          userId: nb.userId,
          title: nb.title,
          description: nb.description ?? null,
          color: nb.color,
          createdAt: new Date(nb.createdAt),
          updatedAt: new Date(nb.updatedAt),
        },
      });
    }
    console.log(`✅ Migrados ${data.notebooks.length} cadernos`);
  }

  // ── 3. Migrar Leaves ──
  if (data.leaves?.length > 0) {
    for (const leaf of data.leaves) {
      await prisma.leaf.upsert({
        where: { id: leaf.id },
        update: {
          title: leaf.title,
          content: leaf.content ?? '',
          rawText: leaf.rawText ?? '',
          summary: leaf.summary ?? null,
        },
        create: {
          id: leaf.id,
          notebookId: leaf.notebookId,
          title: leaf.title,
          content: leaf.content ?? '',
          rawText: leaf.rawText ?? '',
          summary: leaf.summary ?? null,
          createdAt: new Date(leaf.createdAt),
          updatedAt: new Date(leaf.updatedAt),
        },
      });
    }
    console.log(`✅ Migradas ${data.leaves.length} folhas`);
  }

  // ── 4. Migrar Flashcards ──
  if (data.flashcards?.length > 0) {
    for (const card of data.flashcards) {
      await prisma.flashcard.upsert({
        where: { id: card.id },
        update: {
          front: card.front,
          back: card.back,
          repetitions: card.repetitions ?? 0,
          interval: card.interval ?? 0,
          easeFactor: card.easeFactor ?? 2.5,
          nextReviewDate: new Date(card.nextReviewDate),
        },
        create: {
          id: card.id,
          leafId: card.leafId,
          notebookId: card.notebookId,
          front: card.front,
          back: card.back,
          repetitions: card.repetitions ?? 0,
          interval: card.interval ?? 0,
          easeFactor: card.easeFactor ?? 2.5,
          nextReviewDate: new Date(card.nextReviewDate),
          createdAt: new Date(card.createdAt),
          updatedAt: new Date(card.updatedAt),
        },
      });
    }
    console.log(`✅ Migrados ${data.flashcards.length} flashcards`);
  }

  // ── 5. Migrar StudySessions ──
  if (data.studySessions?.length > 0) {
    for (const session of data.studySessions) {
      await prisma.studySession.upsert({
        where: {
          notebookId_userId: {
            notebookId: session.notebookId,
            userId: session.userId,
          },
        },
        update: {
          currentIndex: session.currentIndex ?? 0,
          reviewedCount: session.reviewedCount ?? 0,
          showAnswer: session.showAnswer ?? false,
          sessionActive: session.sessionActive ?? false,
          flashcards: JSON.stringify(session.flashcards ?? []),
          completedCardIds: JSON.stringify(session.completedCardIds ?? []),
          scores: JSON.stringify(session.scores ?? {}),
        },
        create: {
          notebookId: session.notebookId,
          userId: session.userId,
          currentIndex: session.currentIndex ?? 0,
          reviewedCount: session.reviewedCount ?? 0,
          showAnswer: session.showAnswer ?? false,
          sessionActive: session.sessionActive ?? false,
          flashcards: JSON.stringify(session.flashcards ?? []),
          completedCardIds: JSON.stringify(session.completedCardIds ?? []),
          scores: JSON.stringify(session.scores ?? {}),
          createdAt: session.createdAt ? new Date(session.createdAt) : new Date(),
          updatedAt: session.updatedAt ? new Date(session.updatedAt) : new Date(),
        },
      });
    }
    console.log(`✅ Migradas ${data.studySessions.length} sessões de estudo`);
  }

  console.log('\n🎉 Migração de dados concluída com sucesso!');
}

main()
  .catch((e) => {
    console.error('❌ Erro durante a migração:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
