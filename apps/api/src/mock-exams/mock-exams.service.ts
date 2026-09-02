import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SharingService } from '../sharing/sharing.service';

@Injectable()
export class MockExamsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sharing: SharingService,
  ) {}

  async findAll(userId: string, notebookId?: string) {
    const where: Prisma.MockExamWhereInput = {};
    if (notebookId) {
      await this.sharing.getVisibleContext(userId, 'notebook', notebookId);
      where.notebookId = notebookId;
    } else {
      const sharedIds = await this.sharedExamIds(userId);
      where.OR = [{ userId }, { id: { in: sharedIds } }];
    }
    return this.prisma.withConnection(() =>
      this.prisma.mockExam.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          notebook: { select: { title: true, color: true } },
          _count: {
            select: { questions: true, attempts: true },
          },
        },
      }),
    );
  }

  private async sharedExamIds(userId: string): Promise<string[]> {
    const shares = await this.prisma.withConnection(() =>
      this.prisma.share.findMany({
        where: { sharedWithUserId: userId, resourceType: 'mockExam' },
        select: { resourceId: true },
      }),
    );
    return shares.map((s) => s.resourceId);
  }

  /** Submete e corrige uma tentativa de simulado (owner ou editor). */
  async submit(
    examId: string,
    userId: string,
    data: {
      answers?: Record<string, string>;
      selfGrades?: Record<string, boolean>;
    },
  ) {
    await this.sharing.getVisibleContext(userId, 'mockExam', examId);

    const exam = await this.prisma.withConnection(() =>
      this.prisma.mockExam.findUnique({
        where: { id: examId },
        include: {
          questions: {
            orderBy: { order: 'asc' },
            select: { question: true },
          },
        },
      }),
    );
    if (!exam) throw new NotFoundException('Simulado não encontrado');

    const questions = exam.questions.map((eq) => eq.question);
    if (questions.length === 0) {
      throw new BadRequestException(
        'Simulado sem questões — adicione questões antes de responder',
      );
    }

    const answers = data.answers ?? {};
    const selfGrades = data.selfGrades ?? {};

    const correctCount = questions.filter((q) => {
      if (q.questionType === 'dissertative') {
        return selfGrades[q.id] === true;
      }
      return answers[q.id] === q.correctAnswer;
    }).length;

    const totalQuestions = questions.length;
    const score = Math.round((correctCount / totalQuestions) * 100);

    return this.prisma.withConnection(() =>
      this.prisma.mockExamAttempt.create({
        data: {
          examId,
          userId,
          answers: JSON.stringify(answers),
          selfGrades: JSON.stringify(selfGrades),
          correctCount,
          totalQuestions,
          score,
        },
      }),
    );
  }

  /** Lista as tentativas de um simulado (owner vê todas; editor vê as suas). */
  async findAttempts(examId: string, userId: string) {
    const level = await this.sharing.getAccessLevel(userId, 'mockExam', examId);
    if (level === 'none') throw new NotFoundException('Simulado não encontrado');

    const where: Prisma.MockExamAttemptWhereInput = { examId };
    if (level === 'editor') where.userId = userId;

    return this.prisma.withConnection(() =>
      this.prisma.mockExamAttempt.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      }),
    );
  }

  async findOne(id: string, userId: string) {
    await this.sharing.getVisibleContext(userId, 'mockExam', id);
    const exam = await this.prisma.withConnection(() =>
      this.prisma.mockExam.findUnique({
        where: { id },
        include: {
          notebook: { select: { title: true, color: true } },
          questions: {
            orderBy: { order: 'asc' },
            include: {
              question: {
                include: {
                  notebook: { select: { title: true, color: true } },
                },
              },
            },
          },
        },
      }),
    );
    if (!exam) throw new NotFoundException('Simulado não encontrado');
    return exam;
  }

  async create(
    userId: string,
    data: {
      title: string;
      description?: string;
      timeLimit?: number;
      notebookId?: string;
    },
  ) {
    if (data.notebookId) {
      await this.sharing.getEditableContext(userId, 'notebook', data.notebookId);
    }

    return this.prisma.withConnection(() =>
      this.prisma.mockExam.create({
        data: {
          userId,
          title: data.title,
          description: data.description || null,
          timeLimit: data.timeLimit || null,
          notebookId: data.notebookId || null,
        },
      }),
    );
  }

  async addQuestion(examId: string, questionId: string, userId: string) {
    await this.sharing.getEditableContext(userId, 'mockExam', examId);
    await this.sharing.getEditableContext(userId, 'question', questionId);

    // Verifica se já existe
    const existing = await this.prisma.withConnection(() =>
      this.prisma.mockExamQuestion.findUnique({
        where: { examId_questionId: { examId, questionId } },
      }),
    );
    if (existing) throw new BadRequestException('Questão já adicionada ao simulado');

    // Próxima ordem
    const maxOrder = await this.prisma.withConnection(() =>
      this.prisma.mockExamQuestion.aggregate({
        where: { examId },
        _max: { order: true },
      }),
    );

    return this.prisma.withConnection(() =>
      this.prisma.mockExamQuestion.create({
        data: {
          examId,
          questionId,
          order: (maxOrder._max.order ?? -1) + 1,
        },
        include: {
          question: {
            include: {
              notebook: { select: { title: true, color: true } },
            },
          },
        },
      }),
    );
  }

  async removeQuestion(examId: string, questionId: string, userId: string) {
    await this.sharing.getEditableContext(userId, 'mockExam', examId);

    await this.prisma.withConnection(() =>
      this.prisma.mockExamQuestion.delete({
        where: { examId_questionId: { examId, questionId } },
      }),
    );

    return { success: true };
  }

  async createFromQuestions(
    userId: string,
    data: {
      title: string;
      description?: string;
      timeLimit?: number;
      notebookId?: string;
      questionIds: string[];
    },
  ) {
    if (data.notebookId) {
      await this.sharing.getEditableContext(userId, 'notebook', data.notebookId);
    }

    const ids = [...new Set(data.questionIds)];
    const found = await this.prisma.withConnection(() =>
      this.prisma.question.findMany({
        where: { id: { in: ids } },
        select: { id: true, notebookId: true },
      }),
    );

    // Cada questão deve ser acessível (própria, compartilhada ou do caderno acessível)
    for (const q of found) {
      const level = await this.sharing.getAccessLevel(userId, 'question', q.id);
      if (level === 'none') {
        throw new NotFoundException('Uma ou mais questões não foram encontradas');
      }
    }
    if (found.length !== ids.length) {
      throw new NotFoundException('Uma ou mais questões não foram encontradas');
    }

    const exam = await this.prisma.withConnection(() =>
      this.prisma.mockExam.create({
        data: {
          userId,
          title: data.title,
          description: data.description || null,
          timeLimit: data.timeLimit || null,
          notebookId: data.notebookId || null,
        },
      }),
    );

    await this.prisma.withConnection(() =>
      this.prisma.mockExamQuestion.createMany({
        data: ids.map((questionId, idx) => ({
          examId: exam.id,
          questionId,
          order: idx,
        })),
      }),
    );

    return this.findOne(exam.id, userId);
  }

  async generateFromNotebook(userId: string, notebookId: string, title?: string) {
    await this.sharing.getEditableContext(userId, 'notebook', notebookId);

    const questions = await this.prisma.withConnection(() =>
      this.prisma.question.findMany({
        where: { notebookId },
        take: 20,
        orderBy: { createdAt: 'desc' },
      }),
    );

    if (questions.length === 0) {
      throw new BadRequestException('Nenhuma questão encontrada neste caderno');
    }

    const notebook = await this.prisma.withConnection(() =>
      this.prisma.notebook.findUnique({
        where: { id: notebookId },
        select: { title: true },
      }),
    );

    // Embaralha as questões
    const shuffled = [...questions].sort(() => Math.random() - 0.5);

    const exam = await this.prisma.withConnection(() =>
      this.prisma.mockExam.create({
        data: {
          userId,
          notebookId,
          title: title || `Simulado - ${notebook?.title || 'Sem título'}`,
          description: `Simulado gerado automaticamente com ${shuffled.length} questões`,
          timeLimit: Math.ceil(shuffled.length * 1.5), // 1.5 min per question
        },
      }),
    );

    // Adiciona questões
    await this.prisma.withConnection(() =>
      this.prisma.mockExamQuestion.createMany({
        data: shuffled.map((q, idx) => ({
          examId: exam.id,
          questionId: q.id,
          order: idx,
        })),
      }),
    );

    return this.findOne(exam.id, userId);
  }

  async remove(examId: string, userId: string): Promise<void> {
    await this.sharing.getOwnedContext(userId, 'mockExam', examId);

    await this.prisma.withConnection(() =>
      this.prisma.mockExam.delete({ where: { id: examId } }),
    );
  }
}