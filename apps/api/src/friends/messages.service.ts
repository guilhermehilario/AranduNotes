import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { ChatMessage } from "./friends.types";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

@Injectable()
export class MessagesService {
  constructor(private readonly prisma: PrismaService) {}

  /** Valida que dois usuários são amigos (relação bilateral). */
  private async assertFriendship(userId: string, friendId: string) {
    if (userId === friendId) {
      throw new BadRequestException("Você não pode mandar mensagem para si mesmo.");
    }
    const f = await this.prisma.withConnection(() =>
      this.prisma.friend.findUnique({
        where: { ownerId_friendId: { ownerId: userId, friendId } },
      }),
    );
    if (!f) {
      throw new ForbiddenException("Vocês não são amigos.");
    }
  }

  async listConversation(
    userId: string,
    friendId: string,
    opts: { cursor?: string; limit?: number },
  ): Promise<{ items: ChatMessage[]; nextCursor: string | null }> {
    await this.assertFriendship(userId, friendId);
    const limit = Math.min(Number(opts.limit) || DEFAULT_LIMIT, MAX_LIMIT);

    const messages = await this.prisma.withConnection(() =>
      this.prisma.directMessage.findMany({
        where: {
          OR: [
            { senderId: userId, recipientId: friendId },
            { senderId: friendId, recipientId: userId },
          ],
          ...(opts.cursor
            ? { createdAt: { lt: new Date(opts.cursor) } }
            : {}),
        },
        orderBy: { createdAt: "desc" },
        take: limit + 1,
      }),
    );

    const hasMore = messages.length > limit;
    const page = hasMore ? messages.slice(0, limit) : messages;
    const items = page
      .map((m) => this.mapMessage(m))
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

    const nextCursor =
      hasMore && items.length ? items[items.length - 1].createdAt : null;

    return { items, nextCursor };
  }

  async sendText(userId: string, friendId: string, content: string) {
    const text = (content ?? "").trim();
    if (!text) throw new BadRequestException("Mensagem vazia.");
    await this.assertFriendship(userId, friendId);
    return this.prisma.withConnection(() =>
      this.prisma.directMessage.create({
        data: {
          senderId: userId,
          recipientId: friendId,
          contentType: "text",
          content: text.slice(0, 4000),
        },
      }),
    ).then((m) => this.mapMessage(m));
  }

  async sendContentLink(
    userId: string,
    friendId: string,
    ref: { resourceType: string; resourceId: string; title: string },
  ) {
    await this.assertFriendship(userId, friendId);
    return this.prisma.withConnection(() =>
      this.prisma.directMessage.create({
        data: {
          senderId: userId,
          recipientId: friendId,
          contentType: "content_link",
          content: ref.title,
          contentRef: JSON.stringify(ref),
        },
      }),
    ).then((m) => this.mapMessage(m));
  }

  async markConversationRead(userId: string, friendId: string) {
    await this.assertFriendship(userId, friendId);
    await this.prisma.withConnection(() =>
      this.prisma.directMessage.updateMany({
        where: { senderId: friendId, recipientId: userId, readAt: null },
        data: { readAt: new Date() },
      }),
    );
    return { success: true };
  }

  private mapMessage(m: {
    id: string;
    senderId: string;
    recipientId: string;
    contentType: string;
    content: string;
    contentRef: string | null;
    readAt: Date | null;
    createdAt: Date;
  }): ChatMessage {
    let ref = null;
    if (m.contentRef) {
      try {
        ref = JSON.parse(m.contentRef);
      } catch {
        ref = null;
      }
    }
    return {
      id: m.id,
      senderId: m.senderId,
      recipientId: m.recipientId,
      contentType: m.contentType,
      content: m.content,
      contentRef: ref,
      readAt: m.readAt?.toISOString() ?? null,
      createdAt: m.createdAt.toISOString(),
    };
  }
}
