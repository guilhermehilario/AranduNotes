import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { randomBytes } from "crypto";
import { PrismaService } from "../prisma/prisma.service";
import { AccessLevel, ResourceType, ShareContext } from "./sharing.types";
import { Notebook } from "@prisma/client";

const RESOURCE_LABEL: Record<ResourceType, string> = {
  notebook: "caderno",
  leaf: "folha",
  question: "questão",
  flashcard: "flashcard",
  mockExam: "simulado",
};

/**
 * Controle de acesso centralizado.
 *
 * Regras:
 *  - owner  = criador do recurso (acesso total);
 *  - editor = usuário com quem o recurso (ou um ancestral, como o caderno)
 *             foi explicitamente compartilhado — pode visualizar e editar;
 *  - viewer = acesso somente-leitura, concedido via link público
 *             (endpoints /public com token, sem login);
 *  - delete/gestão de compartilhamentos continua restrito ao owner.
 */
@Injectable()
export class SharingService {
  constructor(private readonly prisma: PrismaService) {}

  private labels = RESOURCE_LABEL;

  async resolveContext(
    type: ResourceType,
    resourceId: string,
  ): Promise<ShareContext | null> {
    switch (type) {
      case "notebook": {
        const n = await this.prisma.withConnection(() =>
          this.prisma.notebook.findUnique({
            where: { id: resourceId },
            select: {
              userId: true,
              deletedAt: true,
              isPublic: true,
              publicToken: true,
            },
          }),
        );
        if (!n) return null;
        return {
          ownerId: n.userId,
          deletedAt: n.deletedAt,
          notebookId: resourceId,
          leafId: null,
          publicChain: [
            { type, id: resourceId, isPublic: n.isPublic, token: n.publicToken },
          ],
        };
      }
      case "leaf": {
        const l = await this.prisma.withConnection(() =>
          this.prisma.leaf.findUnique({
            where: { id: resourceId },
            select: {
              notebookId: true,
              deletedAt: true,
              isPublic: true,
              publicToken: true,
              notebook: {
                select: {
                  userId: true,
                  deletedAt: true,
                  isPublic: true,
                  publicToken: true,
                },
              },
            },
          }),
        );
        if (!l) return null;
        return {
          ownerId: l.notebook.userId,
          deletedAt: l.deletedAt ? l.deletedAt : l.notebook.deletedAt,
          notebookId: l.notebookId,
          leafId: resourceId,
          publicChain: [
            { type, id: resourceId, isPublic: l.isPublic, token: l.publicToken },
            {
              type: "notebook",
              id: l.notebookId,
              isPublic: l.notebook.isPublic,
              token: l.notebook.publicToken,
            },
          ],
        };
      }
      case "flashcard": {
        const f = await this.prisma.withConnection(() =>
          this.prisma.flashcard.findUnique({
            where: { id: resourceId },
            select: {
              notebookId: true,
              leafId: true,
              deletedAt: true,
              isPublic: true,
              publicToken: true,
              notebook: {
                select: {
                  userId: true,
                  deletedAt: true,
                  isPublic: true,
                  publicToken: true,
                },
              },
            },
          }),
        );
        if (!f) return null;
        return {
          ownerId: f.notebook.userId,
          deletedAt: f.deletedAt ? f.deletedAt : f.notebook.deletedAt,
          notebookId: f.notebookId,
          leafId: f.leafId,
          publicChain: [
            { type, id: resourceId, isPublic: f.isPublic, token: f.publicToken },
            {
              type: "notebook",
              id: f.notebookId,
              isPublic: f.notebook.isPublic,
              token: f.notebook.publicToken,
            },
          ],
        };
      }
      case "question": {
        const q = await this.prisma.withConnection(() =>
          this.prisma.question.findUnique({
            where: { id: resourceId },
            select: {
              userId: true,
              notebookId: true,
              isPublic: true,
              publicToken: true,
              notebook: {
                select: {
                  deletedAt: true,
                  isPublic: true,
                  publicToken: true,
                },
              },
            },
          }),
        );
        if (!q) return null;
        return {
          ownerId: q.userId,
          deletedAt: q.notebook?.deletedAt ?? null,
          notebookId: q.notebookId,
          leafId: null,
          publicChain: [
            { type, id: resourceId, isPublic: q.isPublic, token: q.publicToken },
            {
              type: "notebook",
              id: q.notebookId,
              isPublic: q.notebook?.isPublic ?? false,
              token: q.notebook?.publicToken ?? null,
            },
          ],
        };
      }
      case "mockExam": {
        const m = await this.prisma.withConnection(() =>
          this.prisma.mockExam.findUnique({
            where: { id: resourceId },
            select: {
              userId: true,
              notebookId: true,
              isPublic: true,
              publicToken: true,
              notebook: {
                select: {
                  deletedAt: true,
                  isPublic: true,
                  publicToken: true,
                },
              },
            },
          }),
        );
        if (!m) return null;
        const chain: ShareContext["publicChain"] = [
          { type, id: resourceId, isPublic: m.isPublic, token: m.publicToken },
        ];
        if (m.notebookId) {
          chain.push({
            type: "notebook",
            id: m.notebookId,
            isPublic: m.notebook?.isPublic ?? false,
            token: m.notebook?.publicToken ?? null,
          });
        }
        return {
          ownerId: m.userId,
          deletedAt: m.notebook?.deletedAt ?? null,
          notebookId: m.notebookId,
          leafId: null,
          publicChain: chain,
        };
      }
      default:
        return null;
    }
  }

  private async hasDirectShare(
    type: ResourceType,
    resourceId: string,
    userId: string,
  ): Promise<boolean> {
    const share = await this.prisma.withConnection(() =>
      this.prisma.share.findUnique({
        where: {
          resourceType_resourceId_sharedWithUserId: {
            resourceType: type,
            resourceId,
            sharedWithUserId: userId,
          },
        },
        select: { id: true },
      }),
    );
    return Boolean(share);
  }

  private async hasAncestorShare(
    ctx: ShareContext,
    userId: string,
  ): Promise<boolean> {
    return (await this.getAncestorLevel(ctx, userId, "")) !== "none";
  }

  /**
   * Nível de acesso de um usuário autenticado a um recurso.
   * 'viewer' é tratado apenas pelos endpoints públicos (com token);
   * aqui, recursos públicos sem compartilhamento = 'none'.
   */
  async getAccessLevel(
    userId: string,
    type: ResourceType,
    resourceId: string,
  ): Promise<AccessLevel> {
    const ctx = await this.resolveContext(type, resourceId);
    if (!ctx) return "none";
    if (ctx.deletedAt) return "none";
    if (ctx.ownerId === userId) return "owner";
    if (await this.hasDirectShare(type, resourceId, userId)) return "editor";
    const ancestorLevel = await this.getAncestorLevel(ctx, userId, resourceId);
    if (ancestorLevel !== "none") return ancestorLevel;
    return "none";
  }

  /**
   * Nível de acesso herdado de ancestrais (caderno/folha) atribuído a um
   * usuário. Para compartilhamentos de caderno com escopo, considera se o
   * recurso (folha) está dentro do conjunto de folhas compartilhadas.
   */
  private async getAncestorLevel(
    ctx: ShareContext,
    userId: string,
    resourceId: string,
  ): Promise<AccessLevel> {
    if (ctx.notebookId) {
      const notebookScope = await this.getNotebookShareScope(
        ctx.notebookId,
        userId,
      );
      if (notebookScope === null) {
        // Sem compartilhamento de caderno -> nenhum acesso de ancestral
        return "none";
      }
      if (notebookScope === "all" || notebookScope.includes(resourceId)) {
        // Acesso total ao caderno, ou o recurso (folha) está no escopo.
        return "editor";
      }
      return "none";
    }
    return "none";
  }

  /**
   * Retorna o escopo de acesso a um caderno para um usuário:
   *  - 'all'      -> acesso a todas as folhas (share sem escopo)
   *  - string[]   -> lista de leafIds permitidos (share com escopo)
   *  - null       -> sem compartilhamento de caderno
   */
  async getNotebookShareScope(
    notebookId: string,
    userId: string,
  ): Promise<"all" | string[] | null> {
    const shares = await this.prisma.withConnection(() =>
      this.prisma.share.findMany({
        where: { resourceType: "notebook", resourceId: notebookId, sharedWithUserId: userId },
        select: { id: true, _count: { select: { scope: true } } },
      }),
    );
    if (shares.length === 0) return null;
    // Se qualquer share do notebook for sem escopo -> acesso total.
    if (shares.some((s) => s._count.scope === 0)) return "all";
    const scope = await this.prisma.withConnection(() =>
      this.prisma.notebookShareScope.findMany({
        where: { shareId: { in: shares.map((s) => s.id) } },
        select: { leafId: true },
      }),
    );
    return [...new Set(scope.map((s) => s.leafId))];
  }

  /**
   * Nível de acesso de um usuário a um caderno, retornando também o escopo
   * de folhas visíveis (para filtrar listagens no frontend).
   *  - scopedLeafIds === null          -> acesso total (owner ou editor sem escopo)
   *  - scopedLeafIds: string[]         -> editor com escopo (apenas essas folhas)
   *  - level === 'none'                -> sem acesso
   */
  async getNotebookAccess(
    userId: string,
    notebookId: string,
  ): Promise<{ level: AccessLevel; scopedLeafIds: string[] | null }> {
    const ctx = await this.resolveContext("notebook", notebookId);
    if (!ctx || ctx.deletedAt) return { level: "none", scopedLeafIds: null };
    if (ctx.ownerId === userId) return { level: "owner", scopedLeafIds: null };
    const scope = await this.getNotebookShareScope(notebookId, userId);
    if (scope === null) return { level: "none", scopedLeafIds: null };
    if (scope === "all") return { level: "editor", scopedLeafIds: null };
    return { level: "editor", scopedLeafIds: scope };
  }

  /** Permite visualizar (owner ou editor). Lança NotFound se não existe/privado. */
  async getVisibleContext(
    userId: string,
    type: ResourceType,
    resourceId: string,
  ): Promise<ShareContext> {
    const ctx = await this.resolveContext(type, resourceId);
    if (!ctx || ctx.deletedAt) {
      throw new NotFoundException("Recurso não encontrado");
    }
    const level = await this.getAccessLevel(userId, type, resourceId);
    if (level === "owner" || level === "editor") return ctx;
    throw new NotFoundException("Recurso não encontrado");
  }

  /** Permite editar (owner ou editor). Lança Forbidden se não puder. */
  async getEditableContext(
    userId: string,
    type: ResourceType,
    resourceId: string,
  ): Promise<ShareContext> {
    const ctx = await this.getVisibleContext(userId, type, resourceId);
    const level = await this.getAccessLevel(userId, type, resourceId);
    if (level === "owner" || level === "editor") return ctx;
    throw new ForbiddenException("Acesso negado");
  }

  /** Requer dono do recurso (ex.: excluir, gerenciar compartilhamentos). */
  async getOwnedContext(
    userId: string,
    type: ResourceType,
    resourceId: string,
  ): Promise<ShareContext> {
    const ctx = await this.resolveContext(type, resourceId);
    if (!ctx || ctx.deletedAt || ctx.ownerId !== userId) {
      throw new NotFoundException("Recurso não encontrado");
    }
    return ctx;
  }

  async listShares(type: ResourceType, resourceId: string, userId: string) {
    await this.getOwnedContext(userId, type, resourceId);
    const shares = await this.prisma.withConnection(() =>
      this.prisma.share.findMany({
        where: { resourceType: type, resourceId },
        orderBy: { createdAt: "asc" },
        include: {
          sharedWithUser: { select: { id: true, name: true, email: true } },
          scope: { select: { id: true, leafId: true } },
        },
      }),
    );
    return shares.map((s) => ({
      id: s.id,
      resourceType: s.resourceType,
      resourceId: s.resourceId,
      user: s.sharedWithUser,
      createdAt: s.createdAt,
      scope: s.scope.map((sc) => ({ id: sc.id, leafId: sc.leafId })),
    }));
  }

  async createShare(
    userId: string,
    type: ResourceType,
    resourceId: string,
    target: { email?: string; userId?: string },
    leafIds?: string[],
  ) {
    await this.getOwnedContext(userId, type, resourceId);

    let targetUser = null;
    if (target.userId) {
      targetUser = await this.prisma.withConnection(() =>
        this.prisma.user.findUnique({ where: { id: target.userId } }),
      );
    } else if (target.email) {
      const email = target.email.toLowerCase();
      targetUser = await this.prisma.withConnection(() =>
        this.prisma.user.findFirst({ where: { email } }),
      );
    }
    if (!targetUser) {
      throw new BadRequestException("Usuário não encontrado com esse e-mail");
    }
    if (targetUser.id === userId) {
      throw new BadRequestException("Você já é o criador deste recurso");
    }

    const existing = await this.prisma.withConnection(() =>
      this.prisma.share.findUnique({
        where: {
          resourceType_resourceId_sharedWithUserId: {
            resourceType: type,
            resourceId,
            sharedWithUserId: targetUser.id,
          },
        },
      }),
    );
    if (existing) {
      throw new BadRequestException("Este usuário já tem acesso ao recurso");
    }

    const scopedLeafIds =
      type === "notebook" && leafIds?.length ? await this.validateLeafScope(type, resourceId, leafIds) : [];

    const share = await this.prisma.withConnection(() =>
      this.prisma.share.create({
        data: {
          resourceType: type,
          resourceId,
          ownerId: userId,
          sharedWithUserId: targetUser.id,
          ...(scopedLeafIds.length
            ? {
                scope: {
                  create: scopedLeafIds.map((leafId) => ({ leafId })),
                },
              }
            : {}),
        },
        include: {
          sharedWithUser: { select: { id: true, name: true, email: true } },
          scope: { select: { id: true, leafId: true } },
        },
      }),
    );

    return {
      id: share.id,
      resourceType: share.resourceType,
      resourceId: share.resourceId,
      user: share.sharedWithUser,
      createdAt: share.createdAt,
      scope: share.scope.map((sc) => ({ id: sc.id, leafId: sc.leafId })),
    };
  }

  /** Valida que todos os leafIds pertencem ao caderno do recurso. */
  private async validateLeafScope(
    type: ResourceType,
    resourceId: string,
    leafIds: string[],
  ): Promise<string[]> {
    const unique = [...new Set(leafIds)];
    const leaves = await this.prisma.withConnection(() =>
      this.prisma.leaf.findMany({
        where: { id: { in: unique }, notebookId: resourceId },
        select: { id: true },
      }),
    );
    const found = new Set(leaves.map((l) => l.id));
    const invalid = unique.filter((id) => !found.has(id));
    if (invalid.length) {
      throw new BadRequestException("Algumas folhas não pertencem a este caderno");
    }
    return unique;
  }

  /** Define o escopo (lista de folhas) de um compartilhamento de caderno. */
  async setShareScope(
    shareId: string,
    userId: string,
    leafIds: string[],
  ) {
    const share = await this.prisma.withConnection(() =>
      this.prisma.share.findUnique({
        where: { id: shareId },
        select: { id: true, resourceType: true, resourceId: true },
      }),
    );
    if (!share) throw new NotFoundException("Compartilhamento não encontrado");
    if (share.resourceType !== "notebook") {
      throw new BadRequestException("Apenas cadernos possuem escopo de folhas");
    }

    await this.getOwnedContext(userId, share.resourceType as ResourceType, share.resourceId);

    const validLeafIds =
      leafIds.length ? await this.validateLeafScope("notebook", share.resourceId, leafIds) : [];

    return this.prisma.$transaction(async (tx) => {
      await tx.notebookShareScope.deleteMany({ where: { shareId } });
      if (validLeafIds.length) {
        await tx.notebookShareScope.createMany({
          data: validLeafIds.map((leafId) => ({ shareId, leafId })),
        });
      }
      const updated = await tx.share.findUnique({
        where: { id: shareId },
        include: {
          sharedWithUser: { select: { id: true, name: true, email: true } },
          scope: { select: { id: true, leafId: true } },
        },
      });
      return {
        id: updated!.id,
        resourceType: updated!.resourceType,
        resourceId: updated!.resourceId,
        user: updated!.sharedWithUser,
        createdAt: updated!.createdAt,
        scope: updated!.scope.map((sc) => ({ id: sc.id, leafId: sc.leafId })),
      };
    });
  }


  async removeShare(shareId: string, userId: string) {
    const share = await this.prisma.withConnection(() =>
      this.prisma.share.findUnique({ where: { id: shareId } }),
    );
    if (!share) throw new NotFoundException("Compartilhamento não encontrado");

    const ctx = await this.resolveContext(
      share.resourceType as ResourceType,
      share.resourceId,
    );
    if (!ctx || ctx.ownerId !== userId) {
      throw new ForbiddenException("Acesso negado");
    }

    await this.prisma.withConnection(() =>
      this.prisma.share.delete({ where: { id: shareId } }),
    );
  }

  /** Recursos do tipo indicado compartilhados COM o usuário (para listas). */
  async listSharedResourcesOfType(
    userId: string,
    type: "notebook",
  ): Promise<Notebook[]> {
    const shares = await this.prisma.withConnection(() =>
      this.prisma.share.findMany({
        where: { sharedWithUserId: userId, resourceType: type },
        select: { resourceId: true },
      }),
    );
    if (shares.length === 0) return [];

    const ids = shares.map((s) => s.resourceId);
    const rows = await this.prisma.withConnection(() =>
      this.prisma.notebook.findMany({
        where: { id: { in: ids }, deletedAt: null },
        orderBy: { createdAt: "desc" },
      }),
    );
    return rows;
  }

  /** Recursos compartilhados COM o usuário autenticado (inbox). */
  async listSharedWithMe(userId: string) {
    const shares = await this.prisma.withConnection(() =>
      this.prisma.share.findMany({
        where: { sharedWithUserId: userId },
        orderBy: { createdAt: "desc" },
        include: {
          owner: { select: { id: true, name: true, email: true } },
        },
      }),
    );

    type Row = {
      id: string;
      resourceType: ResourceType;
      resourceId: string;
      title: string;
      subtitle?: string;
      notebookId: string | null;
      leafId: string | null;
      owner: { id: string; name: string; email: string };
      createdAt: Date;
    };
    const items: Row[] = [];

    for (const share of shares) {
      let acted: { id: string; title: string; notebookId: string | null; leafId: string | null; deletedAt: Date | null } | null = null;

      if (share.resourceType === "notebook") {
        const r = await this.prisma.withConnection(() =>
          this.prisma.notebook.findUnique({
            where: { id: share.resourceId },
            select: { id: true, title: true, deletedAt: true },
          }),
        );
        acted = r ? { id: r.id, title: r.title, notebookId: r.id, leafId: null, deletedAt: r.deletedAt } : null;
      } else if (share.resourceType === "leaf") {
        const r = await this.prisma.withConnection(() =>
          this.prisma.leaf.findUnique({
            where: { id: share.resourceId },
            select: { id: true, title: true, notebookId: true, deletedAt: true },
          }),
        );
        acted = r ? { id: r.id, title: r.title, notebookId: r.notebookId, leafId: r.id, deletedAt: r.deletedAt } : null;
      } else if (share.resourceType === "flashcard") {
        const r = await this.prisma.withConnection(() =>
          this.prisma.flashcard.findUnique({
            where: { id: share.resourceId },
            select: { id: true, front: true, notebookId: true, leafId: true, deletedAt: true },
          }),
        );
        acted = r ? { id: r.id, title: r.front, notebookId: r.notebookId, leafId: r.leafId, deletedAt: r.deletedAt } : null;
      } else if (share.resourceType === "question") {
        const r = await this.prisma.withConnection(() =>
          this.prisma.question.findUnique({
            where: { id: share.resourceId },
            select: { id: true, question: true, notebookId: true, leafId: true },
          }),
        );
        acted = r ? { id: r.id, title: r.question, notebookId: r.notebookId, leafId: r.leafId, deletedAt: null } : null;
      } else if (share.resourceType === "mockExam") {
        const r = await this.prisma.withConnection(() =>
          this.prisma.mockExam.findUnique({
            where: { id: share.resourceId },
            select: { id: true, title: true, notebookId: true },
          }),
        );
        acted = r ? { id: r.id, title: r.title, notebookId: r.notebookId, leafId: null, deletedAt: null } : null;
      }

      if (!acted || acted.deletedAt) continue;

      items.push({
        id: share.id,
        resourceType: share.resourceType as ResourceType,
        resourceId: share.resourceId,
        title: acted.title,
        subtitle: share.resourceType === "question" ? acted.title : undefined,
        notebookId: acted.notebookId,
        leafId: acted.leafId,
        owner: share.owner,
        createdAt: share.createdAt,
      });
    }

    return items;
  }

  async setPublic(
    userId: string,
    type: ResourceType,
    resourceId: string,
    isPublic: boolean,
  ) {
    await this.getOwnedContext(userId, type, resourceId);

    const token = isPublic
      ? randomBytes(24).toString("base64url")
      : null;

    const data = { isPublic, publicToken: token };
    const updated =
      type === "notebook"
        ? await this.prisma.withConnection(() =>
            this.prisma.notebook.update({ where: { id: resourceId }, data }),
          )
        : type === "leaf"
          ? await this.prisma.withConnection(() =>
              this.prisma.leaf.update({ where: { id: resourceId }, data }),
            )
          : type === "flashcard"
            ? await this.prisma.withConnection(() =>
                this.prisma.flashcard.update({ where: { id: resourceId }, data }),
              )
            : type === "question"
              ? await this.prisma.withConnection(() =>
                  this.prisma.question.update({ where: { id: resourceId }, data }),
                )
              : await this.prisma.withConnection(() =>
                  this.prisma.mockExam.update({ where: { id: resourceId }, data }),
                );

    return { id: updated.id, isPublic: updated.isPublic, publicToken: updated.publicToken };
  }

  /**
   * Acesso público (sem login) via token. Requer que o recurso (ou um
   * ancestral como o caderno) esteja público e o token corresponda a algum
   * nó da cadeia pública.
   */
  async getPublicContext(
    type: ResourceType,
    resourceId: string,
    token: string,
  ): Promise<ShareContext | null> {
    const ctx = await this.resolveContext(type, resourceId);
    if (!ctx || ctx.deletedAt) return null;
    const ok = ctx.publicChain.some(
      (c) => c.isPublic && c.token === token,
    );
    return ok ? ctx : null;
  }

  label(type: ResourceType): string {
    return this.labels[type] ?? "recurso";
  }
}