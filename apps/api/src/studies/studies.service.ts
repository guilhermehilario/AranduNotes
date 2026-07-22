import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StudiesService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllStudyContent(userId: string, notebookId?: string) {
    const notebookFilter = notebookId ? { notebookId } : {};

    // Busca flashcards com revisão pendente
    const now = new Date();
    const flashcards = await this.prisma.flashcard.findMany({
      where: {
        ...notebookFilter,
        notebook: { userId },
        nextReviewDate: { lte: now },
      },
      orderBy: { nextReviewDate: 'asc' },
      include: {
        notebook: { select: { title: true, color: true } },
      },
    });

    // Busca todas as questões
    const questions = await this.prisma.question.findMany({
      where: {
        ...notebookFilter,
        userId,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        notebook: { select: { title: true, color: true } },
      },
    });

    // Busca simulados
    const mockExams = await this.prisma.mockExam.findMany({
      where: {
        ...(notebookId ? { notebookId } : { userId }),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        notebook: { select: { title: true, color: true } },
        _count: { select: { questions: true } },
      },
    });

    return {
      flashcardsDue: flashcards,
      totalFlashcards: flashcards.length,
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
      this.prisma.flashcard.count({
        where: { notebook: { userId } },
      }),
      this.prisma.question.count({ where: { userId } }),
      this.prisma.mockExam.count({ where: { userId } }),
    ]);

    const now = new Date();
    const flashcardsDue = await this.prisma.flashcard.count({
      where: {
        notebook: { userId },
        nextReviewDate: { lte: now },
      },
    });

    return {
      totalFlashcards,
      flashcardsDue,
      totalQuestions,
      totalMockExams,
    };
  }
}
