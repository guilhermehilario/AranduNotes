import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StudiesService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllStudyContent(userId: string, notebookId?: string) {
    // Valida ownership do caderno quando filtrado por notebookId
    if (notebookId) {
      const notebook = await this.prisma.withConnection(() =>
        this.prisma.notebook.findFirst({
          where: { id: notebookId, userId },
        }),
      );
      if (!notebook) throw new NotFoundException('Caderno não encontrado');
    }

    const notebookFilter = notebookId ? { notebookId } : {};
    const now = new Date();

    const [totalFlashcards, flashcardsDue, questions, mockExams] =
      await Promise.all([
        // Total de flashcards (exclui soft-delete)
        this.prisma.withConnection(() =>
          this.prisma.flashcard.count({
            where: {
              ...notebookFilter,
              notebook: { userId },
              deletedAt: null,
            },
          }),
        ),

        // Flashcards com revisão pendente
        this.prisma.withConnection(() =>
          this.prisma.flashcard.findMany({
            where: {
              ...notebookFilter,
              notebook: { userId },
              nextReviewDate: { lte: now },
              deletedAt: null,
            },
            orderBy: { nextReviewDate: 'asc' },
            include: {
              notebook: { select: { title: true, color: true } },
            },
          }),
        ),

        // Todas as questões
        this.prisma.withConnection(() =>
          this.prisma.question.findMany({
            where: {
              ...notebookFilter,
              userId,
            },
            orderBy: { createdAt: 'desc' },
            include: {
              notebook: { select: { title: true, color: true } },
            },
          }),
        ),

        // Simulados
        this.prisma.withConnection(() =>
          this.prisma.mockExam.findMany({
            where: {
              ...(notebookId ? { notebookId, userId } : { userId }),
            },
            orderBy: { createdAt: 'desc' },
            include: {
              notebook: { select: { title: true, color: true } },
              _count: { select: { questions: true } },
            },
          }),
        ),
      ]);

    return {
      flashcardsDue,
      totalFlashcards,
      questions,
      totalQuestions: questions.length,
      mockExams,
      totalMockExams: mockExams.length,
    };
  }

  async getStats(userId: string) {
    const [
      totalFlashcards,
      totalQuestions,
      totalMockExams,
    ] = await Promise.all([
      this.prisma.withConnection(() =>
        this.prisma.flashcard.count({
          where: { notebook: { userId }, deletedAt: null },
        }),
      ),
      this.prisma.withConnection(() =>
        this.prisma.question.count({ where: { userId } }),
      ),
      this.prisma.withConnection(() =>
        this.prisma.mockExam.count({ where: { userId } }),
      ),
    ]);

    const now = new Date();
    const flashcardsDue = await this.prisma.withConnection(() =>
      this.prisma.flashcard.count({
        where: {
          notebook: { userId },
          nextReviewDate: { lte: now },
          deletedAt: null,
        },
      }),
    );

    return {
      totalFlashcards,
      flashcardsDue,
      totalQuestions,
      totalMockExams,
    };
  }
}
