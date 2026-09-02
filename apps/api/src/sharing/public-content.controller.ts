import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { PrismaService } from "../prisma/prisma.service";
import { SharingService } from "./sharing.service";
import { PublicTokenDto } from "./dto/sharing.dto";
import { ResourceType } from "./sharing.types";
import { buildTree } from "../prisma/utils/build-tree.util";

const TYPE_ALIASES: Record<string, ResourceType> = {
  notebook: "notebook",
  notebooks: "notebook",
  leaf: "leaf",
  leaves: "leaf",
  question: "question",
  questions: "question",
  flashcard: "flashcard",
  flashcards: "flashcard",
  mockExam: "mockExam",
  "mock-exam": "mockExam",
  "mock-exams": "mockExam",
};

/**
 * Endpoints públicos SEM autenticação. O acesso é controlado pelo token do
 * link público: só retornam conteúdo se o recurso (ou um ancestral) estiver
 * com isPublic=true e o token conferir.
 */
@Controller("public")
export class PublicContentController {
  constructor(
    private readonly sharingService: SharingService,
    private readonly prisma: PrismaService,
  ) {}

  @Get("notebooks/:id/leaves")
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  async getNotebookLeaves(
    @Param("id") notebookId: string,
    @Query() query: PublicTokenDto,
  ) {
    const ctx = await this.sharingService.getPublicContext(
      "notebook",
      notebookId,
      query.token,
    );
    if (!ctx) throw new NotFoundException("Recurso não encontrado");

    const leaves = await this.prisma.withConnection(() =>
      this.prisma.leaf.findMany({
        where: { notebookId, deletedAt: null, archivedAt: null },
        select: {
          id: true,
          title: true,
          summary: true,
          parentId: true,
          position: true,
        },
        orderBy: { position: "asc" },
      }),
    );
    return buildTree(leaves);
  }

  @Get(":type/:id")
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  async getResource(
    @Param("type") rawType: string,
    @Param("id") id: string,
    @Query() query: PublicTokenDto,
  ) {
    const type = TYPE_ALIASES[rawType];
    if (!type) throw new NotFoundException("Recurso não encontrado");

    const ctx = await this.sharingService.getPublicContext(type, id, query.token);
    if (!ctx) throw new NotFoundException("Recurso não encontrado");

    switch (type) {
      case "notebook": {
        const n = await this.prisma.withConnection(() =>
          this.prisma.notebook.findUnique({
            where: { id },
            select: { id: true, title: true, description: true, color: true },
          }),
        );
        if (!n) throw new NotFoundException("Recurso não encontrado");
        return n;
      }
      case "leaf": {
        const l = await this.prisma.withConnection(() =>
          this.prisma.leaf.findUnique({
            where: { id },
            select: { id: true, title: true, content: true, summary: true },
          }),
        );
        if (!l) throw new NotFoundException("Recurso não encontrado");
        return l;
      }
      case "question": {
        const q = await this.prisma.withConnection(() =>
          this.prisma.question.findUnique({
            where: { id },
            select: {
              id: true,
              question: true,
              options: true,
              questionType: true,
              explanation: true,
              theme: true,
            },
          }),
        );
        if (!q) throw new NotFoundException("Recurso não encontrado");
        return {
          id: q.id,
          question: q.question,
          options: JSON.parse(q.options || "[]"),
          questionType: q.questionType,
          explanation: q.explanation,
          theme: q.theme,
        };
      }
      case "flashcard": {
        const f = await this.prisma.withConnection(() =>
          this.prisma.flashcard.findUnique({
            where: { id },
            select: { id: true, front: true, back: true },
          }),
        );
        if (!f) throw new NotFoundException("Recurso não encontrado");
        return f;
      }
      case "mockExam": {
        const m = await this.prisma.withConnection(() =>
          this.prisma.mockExam.findUnique({
            where: { id },
            select: {
              id: true,
              title: true,
              description: true,
              timeLimit: true,
              questions: {
                select: {
                  question: {
                    select: {
                      id: true,
                      question: true,
                      options: true,
                      questionType: true,
                      theme: true,
                    },
                  },
                },
              },
            },
          }),
        );
        if (!m) throw new NotFoundException("Recurso não encontrado");
        return {
          id: m.id,
          title: m.title,
          description: m.description,
          timeLimit: m.timeLimit,
          questions: m.questions.map((link) => ({
            id: link.question.id,
            question: link.question.question,
            options: JSON.parse(link.question.options || "[]"),
            questionType: link.question.questionType,
            theme: link.question.theme,
          })),
        };
      }
      default:
        throw new NotFoundException("Recurso não encontrado");
    }
  }
}