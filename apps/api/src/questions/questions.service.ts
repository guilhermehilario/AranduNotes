import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class QuestionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string, notebookId?: string) {
    const where: any = { userId };
    if (notebookId) where.notebookId = notebookId;
    return this.prisma.question.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        notebook: { select: { title: true, color: true } },
        leaf: { select: { title: true } },
      },
    });
  }

  async findOne(id: string, userId: string) {
    const question = await this.prisma.question.findFirst({
      where: { id, userId },
      include: {
        notebook: { select: { title: true, color: true } },
        leaf: { select: { title: true } },
      },
    });
    if (!question) throw new NotFoundException('Questão não encontrada');
    return question;
  }

  async create(
    userId: string,
    data: {
      leafId?: string;
      notebookId: string;
      question: string;
      options?: string;
      correctAnswer: string;
      explanation?: string;
      questionType?: string;
    },
  ) {
    // Verify notebook ownership
    const notebook = await this.prisma.notebook.findFirst({
      where: { id: data.notebookId, userId },
    });
    if (!notebook) throw new NotFoundException('Caderno não encontrado');

    return this.prisma.question.create({
      data: {
        userId,
        leafId: data.leafId || null,
        notebookId: data.notebookId,
        question: data.question,
        options: data.options || '[]',
        correctAnswer: data.correctAnswer,
        explanation: data.explanation || null,
        questionType: data.questionType || 'multiple_choice',
      },
    });
  }

  async update(
    id: string,
    userId: string,
    data: {
      question?: string;
      options?: string;
      correctAnswer?: string;
      explanation?: string;
      questionType?: string;
    },
  ) {
    const question = await this.prisma.question.findFirst({
      where: { id, userId },
    });
    if (!question) throw new NotFoundException('Questão não encontrada');

    const updates: Record<string, any> = {};
    if (data.question !== undefined) updates.question = data.question;
    if (data.options !== undefined) updates.options = data.options;
    if (data.correctAnswer !== undefined) updates.correctAnswer = data.correctAnswer;
    if (data.explanation !== undefined) updates.explanation = data.explanation;
    if (data.questionType !== undefined) updates.questionType = data.questionType;

    return this.prisma.question.update({
      where: { id },
      data: updates,
    });
  }

  async remove(id: string, userId: string): Promise<void> {
    const question = await this.prisma.question.findFirst({
      where: { id, userId },
    });
    if (!question) throw new NotFoundException('Questão não encontrada');

    await this.prisma.question.delete({ where: { id } });
  }

  async getRandomQuestions(userId: string, limit: number = 10, notebookId?: string) {
    const where: any = { userId };
    if (notebookId) where.notebookId = notebookId;

    const total = await this.prisma.question.count({ where });
    if (total === 0) return [];

    // Pega uma amostra aleatória usando skip
    const take = Math.min(limit, total);
    const skip = Math.max(0, Math.floor(Math.random() * (total - take + 1)));

    return this.prisma.question.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        notebook: { select: { title: true, color: true } },
      },
    });
  }

  async generateFromFlashcard(flashcardId: string, userId: string) {
    const flashcard = await this.prisma.flashcard.findUnique({
      where: { id: flashcardId },
      include: { notebook: true },
    });

    if (!flashcard || flashcard.notebook.userId !== userId) {
      throw new NotFoundException('Flashcard não encontrado');
    }

    // Converte front/back em uma questão de múltipla escolha simples
    const questionData = {
      userId,
      notebookId: flashcard.notebookId,
      leafId: flashcard.leafId,
      question: flashcard.front,
      options: JSON.stringify([
        flashcard.back,
        'Nenhuma das alternativas',
        'Todas as alternativas',
        'Não sei responder',
      ]),
      correctAnswer: flashcard.back,
      explanation: 'Esta questão foi gerada automaticamente a partir de um flashcard.',
      questionType: 'multiple_choice' as const,
    };

    return this.prisma.question.create({ data: questionData });
  }
}
