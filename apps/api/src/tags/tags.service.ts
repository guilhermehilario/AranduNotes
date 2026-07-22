import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TagsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.tag.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string, userId: string) {
    const tag = await this.prisma.tag.findFirst({
      where: { id, userId },
      include: {
        leaves: {
          include: { leaf: true },
        },
      },
    });
    if (!tag) throw new NotFoundException('Tag não encontrada');
    return tag;
  }

  async create(userId: string, data: { name: string; color?: string }) {
    // Check if tag already exists for this user
    const existing = await this.prisma.tag.findFirst({
      where: { userId, name: data.name },
    });
    if (existing) throw new ConflictException('Tag já existe');

    return this.prisma.tag.create({
      data: {
        userId,
        name: data.name,
        color: data.color ?? '#aa3bff',
      },
    });
  }

  async update(
    id: string,
    userId: string,
    data: { name?: string; color?: string },
  ) {
    const tag = await this.prisma.tag.findFirst({
      where: { id, userId },
    });
    if (!tag) throw new NotFoundException('Tag não encontrada');

    if (data.name) {
      const existing = await this.prisma.tag.findFirst({
        where: { userId, name: data.name, id: { not: id } },
      });
      if (existing) throw new ConflictException('Já existe outra tag com este nome');
    }

    return this.prisma.tag.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.color !== undefined && { color: data.color }),
      },
    });
  }

  async remove(id: string, userId: string): Promise<void> {
    const tag = await this.prisma.tag.findFirst({
      where: { id, userId },
    });
    if (!tag) throw new NotFoundException('Tag não encontrada');

    await this.prisma.tag.delete({ where: { id } });
  }

  // ── Leaf-Tag associations ──

  async getLeafTags(leafId: string, userId: string) {
    const leaf = await this.prisma.leaf.findUnique({
      where: { id: leafId },
      include: { notebook: true },
    });
    if (!leaf) throw new NotFoundException('Folha não encontrada');
    if (leaf.notebook.userId !== userId)
      throw new ForbiddenException('Acesso negado');

    const leafTags = await this.prisma.leafTag.findMany({
      where: { leafId },
      include: { tag: true },
    });
    return leafTags.map((lt) => lt.tag);
  }

  async addTagToLeaf(leafId: string, tagId: string, userId: string) {
    const leaf = await this.prisma.leaf.findUnique({
      where: { id: leafId },
      include: { notebook: true },
    });
    if (!leaf) throw new NotFoundException('Folha não encontrada');
    if (leaf.notebook.userId !== userId)
      throw new ForbiddenException('Acesso negado');

    const tag = await this.prisma.tag.findFirst({
      where: { id: tagId, userId },
    });
    if (!tag) throw new NotFoundException('Tag não encontrada');

    return this.prisma.leafTag.upsert({
      where: { leafId_tagId: { leafId, tagId } },
      create: { leafId, tagId },
      update: {},
    });
  }

  async removeTagFromLeaf(leafId: string, tagId: string, userId: string) {
    const leaf = await this.prisma.leaf.findUnique({
      where: { id: leafId },
      include: { notebook: true },
    });
    if (!leaf) throw new NotFoundException('Folha não encontrada');
    if (leaf.notebook.userId !== userId)
      throw new ForbiddenException('Acesso negado');

    await this.prisma.leafTag.delete({
      where: { leafId_tagId: { leafId, tagId } },
    });
  }
}
