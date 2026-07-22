import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TrashService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Listar itens na lixeira ──
  async findAll(userId: string) {
    const [notebooks, leaves] = await Promise.all([
      this.prisma.notebook.findMany({
        where: { userId, deletedAt: { not: null } },
        orderBy: { deletedAt: 'desc' },
        include: {
          _count: { select: { leaves: true, flashcards: true } },
        },
      }),
      this.prisma.leaf.findMany({
        where: {
          notebook: { userId },
          deletedAt: { not: null },
        },
        orderBy: { deletedAt: 'desc' },
        include: {
          notebook: { select: { title: true, color: true } },
          _count: { select: { flashcards: true } },
        },
      }),
    ]);

    return {
      notebooks: notebooks.map((nb) => ({
        id: nb.id,
        title: nb.title,
        type: 'notebook' as const,
        deletedAt: nb.deletedAt!,
        color: nb.color,
        description: nb.description,
        leavesCount: nb._count.leaves,
        flashcardsCount: nb._count.flashcards,
      })),
      leaves: leaves.map((leaf) => ({
        id: leaf.id,
        title: leaf.title,
        type: 'leaf' as const,
        deletedAt: leaf.deletedAt!,
        notebookTitle: leaf.notebook.title,
        notebookColor: leaf.notebook.color,
        flashcardsCount: leaf._count.flashcards,
      })),
    };
  }

  // ── Mover notebook para lixeira (soft-delete) ──
  async softDeleteNotebook(notebookId: string, userId: string) {
    const notebook = await this.prisma.notebook.findFirst({
      where: { id: notebookId, userId },
    });
    if (!notebook) throw new NotFoundException('Caderno não encontrado');

    const now = new Date();
    await this.prisma.notebook.update({
      where: { id: notebookId },
      data: { deletedAt: now },
    });

    // Soft-delete all leaves, flashcards, etc. of this notebook
    await this.prisma.leaf.updateMany({
      where: { notebookId },
      data: { deletedAt: now },
    });

    return { message: 'Caderno movido para lixeira', deletedAt: now };
  }

  // ── Mover folha para lixeira (soft-delete) ──
  async softDeleteLeaf(leafId: string, userId: string) {
    const leaf = await this.prisma.leaf.findUnique({
      where: { id: leafId },
      include: { notebook: true },
    });
    if (!leaf) throw new NotFoundException('Folha não encontrada');
    if (leaf.notebook.userId !== userId) throw new NotFoundException('Acesso negado');

    const now = new Date();
    await this.prisma.leaf.update({
      where: { id: leafId },
      data: { deletedAt: now },
    });

    return { message: 'Folha movida para lixeira', deletedAt: now };
  }

  // ── Restaurar notebook da lixeira ──
  async restoreNotebook(notebookId: string, userId: string) {
    const notebook = await this.prisma.notebook.findFirst({
      where: { id: notebookId, userId, deletedAt: { not: null } },
    });
    if (!notebook) throw new NotFoundException('Caderno não encontrado na lixeira');

    await this.prisma.notebook.update({
      where: { id: notebookId },
      data: { deletedAt: null },
    });

    // Restore all soft-deleted leaves
    await this.prisma.leaf.updateMany({
      where: { notebookId, deletedAt: { not: null } },
      data: { deletedAt: null },
    });

    return { message: 'Caderno restaurado da lixeira' };
  }

  // ── Restaurar folha da lixeira ──
  async restoreLeaf(leafId: string, userId: string) {
    const leaf = await this.prisma.leaf.findUnique({
      where: { id: leafId },
      include: { notebook: true },
    });
    if (!leaf) throw new NotFoundException('Folha não encontrada');
    if (leaf.notebook.userId !== userId) throw new NotFoundException('Acesso negado');
    if (!leaf.deletedAt) throw new NotFoundException('Folha não está na lixeira');

    await this.prisma.leaf.update({
      where: { id: leafId },
      data: { deletedAt: null },
    });

    return { message: 'Folha restaurada da lixeira' };
  }

  // ── Excluir permanentemente (apagar da lixeira) ──
  async permanentDeleteNotebook(notebookId: string, userId: string) {
    const notebook = await this.prisma.notebook.findFirst({
      where: { id: notebookId, userId, deletedAt: { not: null } },
    });
    if (!notebook) throw new NotFoundException('Caderno não encontrado na lixeira');

    await this.prisma.notebook.delete({ where: { id: notebookId } });
    return { message: 'Caderno excluído permanentemente' };
  }

  async permanentDeleteLeaf(leafId: string, userId: string) {
    const leaf = await this.prisma.leaf.findUnique({
      where: { id: leafId },
      include: { notebook: true },
    });
    if (!leaf) throw new NotFoundException('Folha não encontrada');
    if (leaf.notebook.userId !== userId) throw new NotFoundException('Acesso negado');
    if (!leaf.deletedAt) throw new NotFoundException('Folha não está na lixeira');

    await this.prisma.leaf.delete({ where: { id: leafId } });
    return { message: 'Folha excluída permanentemente' };
  }

  // ── Limpar lixeira (excluir itens com mais de 15 dias) ──
  async cleanOldTrash(userId: string) {
    const fifteenDaysAgo = new Date();
    fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

    // 1. Busca itens expirados (separado dos deletes para evitar race condition)
    const [oldNotebooks, oldLeaves] = await Promise.all([
      this.prisma.notebook.findMany({
        where: { userId, deletedAt: { lte: fifteenDaysAgo } },
        select: { id: true },
      }),
      this.prisma.leaf.findMany({
        where: {
          notebook: { userId },
          deletedAt: { lte: fifteenDaysAgo },
        },
        select: { id: true, notebookId: true },
      }),
    ]);

    const nbIds = oldNotebooks.map((nb) => nb.id);

    // 2. Exclui cadernos primeiro — o ON DELETE CASCADE do SQLite
    //    remove automaticamente as folhas, flashcards e demais
    //    registros relacionados. Usamos deleteMany que é seguro pois
    //    a cascata é aplicada no nível do banco (SQLite FK).
    if (nbIds.length > 0) {
      await this.prisma.notebook.deleteMany({
        where: { id: { in: nbIds } },
      });
    }

    // 3. Exclui folhas que NÃO pertencem a nenhum caderno excluído
    //    (folhas que foram movidas para lixeira individualmente,
    //    enquanto seus cadernos ainda estão ativos). As folhas que
    //    pertenciam a cadernos excluídos no passo 2 já foram
    //    removidas pelo cascade do banco.
    const standaloneLeafIds = oldLeaves
      .filter((l) => !nbIds.includes(l.notebookId))
      .map((l) => l.id);

    if (standaloneLeafIds.length > 0) {
      await this.prisma.leaf.deleteMany({
        where: { id: { in: standaloneLeafIds } },
      });
    }

    return {
      deletedNotebooks: nbIds.length,
      deletedLeaves: standaloneLeafIds.length,
      message: `Lixeira limpa: ${nbIds.length} cadernos e ${standaloneLeafIds.length} folhas excluídos permanentemente`,
    };
  }
}
