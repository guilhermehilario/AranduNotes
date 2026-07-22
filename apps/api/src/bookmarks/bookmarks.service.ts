import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BookmarksService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.bookmark.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        leaf: { select: { title: true, notebookId: true } },
        notebook: { select: { title: true } },
      },
    });
  }

  async findOne(id: string, userId: string) {
    const bookmark = await this.prisma.bookmark.findFirst({
      where: { id, userId },
      include: {
        leaf: { select: { title: true, notebookId: true } },
        notebook: { select: { title: true } },
      },
    });
    if (!bookmark) throw new NotFoundException('Marcador não encontrado');
    return bookmark;
  }

  async create(
    userId: string,
    data: {
      leafId?: string;
      notebookId?: string;
      title: string;
      path: string;
    },
  ) {
    return this.prisma.bookmark.create({
      data: {
        userId,
        leafId: data.leafId ?? null,
        notebookId: data.notebookId ?? null,
        title: data.title,
        path: data.path,
      },
    });
  }

  async remove(id: string, userId: string): Promise<void> {
    const bookmark = await this.prisma.bookmark.findFirst({
      where: { id, userId },
    });
    if (!bookmark) throw new NotFoundException('Marcador não encontrado');

    await this.prisma.bookmark.delete({ where: { id } });
  }

  async isBookmarked(userId: string, leafId?: string, notebookId?: string): Promise<boolean> {
    const where: any = { userId };
    if (leafId) where.leafId = leafId;
    if (notebookId) where.notebookId = notebookId;

    const bookmark = await this.prisma.bookmark.findFirst({ where });
    return !!bookmark;
  }

  async findByLeaf(leafId: string, userId: string) {
    return this.prisma.bookmark.findFirst({
      where: { userId, leafId },
    });
  }

  async findByNotebook(notebookId: string, userId: string) {
    return this.prisma.bookmark.findFirst({
      where: { userId, notebookId },
    });
  }
}
