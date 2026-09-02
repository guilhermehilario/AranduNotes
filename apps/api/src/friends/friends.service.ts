import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import {
  FriendListItem,
  FriendPresence,
  FriendRequestItem,
  MessageSummary,
  ONLINE_WINDOW_MS,
  PresenceStatus,
} from "./friends.types";

@Injectable()
export class FriendsService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Presença ────────────────────────────────────────────────────────────

  /** Deriva se o usuário está "online" dado status manual + último heartbeat. */
  private computePresence(
    status: string,
    lastActiveAt: Date | null,
    now = new Date(),
  ): FriendPresence {
    if (status === "invisible" || status === "offline") {
      return { online: false, status: status as PresenceStatus, lastActiveAt: lastActiveAt?.toISOString() ?? null };
    }
    const online =
      !!lastActiveAt && now.getTime() - lastActiveAt.getTime() <= ONLINE_WINDOW_MS;
    return {
      online,
      status: (status as PresenceStatus) || "available",
      lastActiveAt: lastActiveAt?.toISOString() ?? null,
    };
  }

  async setStatus(userId: string, status: string) {
    await this.prisma.withConnection(() =>
      this.prisma.user.update({
        where: { id: userId },
        data: { status, lastActiveAt: new Date() },
      }),
    );
    return { status };
  }

  /** Heartbeat do frontend: mantém o usuário "online". */
  async heartbeat(userId: string) {
    await this.prisma.withConnection(() =>
      this.prisma.user.update({
        where: { id: userId },
        data: { lastActiveAt: new Date() },
      }),
    );
    return { ok: true };
  }

  async getMyPresence(userId: string) {
    const u = await this.prisma.withConnection(() =>
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { status: true, lastActiveAt: true },
      }),
    );
    if (!u) throw new NotFoundException("Usuário não encontrado");
    return this.computePresence(u.status, u.lastActiveAt);
  }

  // ── Código de amigo ──────────────────────────────────────────────────────

  /** Gera um código curto e legível (ex.: "ARANDU-7KQ2F9"). */
  private static generateCode(): string {
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sem caract. ambíguos
    let body = "";
    for (let i = 0; i < 6; i++) {
      body += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    return `ARANDU-${body}`;
  }

  /** Retorna o código do usuário, gerando-o na primeira vez (lazy). */
  async getMyFriendCode(userId: string) {
    let user = await this.prisma.withConnection(() =>
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { friendCode: true },
      }),
    );
    if (!user) throw new NotFoundException("Usuário não encontrado");

    if (!user.friendCode) {
      const code = FriendsService.generateCode();
      try {
        user = await this.prisma.withConnection(() =>
          this.prisma.user.update({
            where: { id: userId },
            data: { friendCode: code },
            select: { friendCode: true },
          }),
        );
      } catch {
        // Colisão extremamente rara: tenta de novo uma vez.
        user = await this.prisma.withConnection(() =>
          this.prisma.user.update({
            where: { id: userId },
            data: { friendCode: FriendsService.generateCode() },
            select: { friendCode: true },
          }),
        );
      }
    }
    return { code: user.friendCode! };
  }

  // ── Solicitações de amizade ─────────────────────────────────────────────

  async sendRequest(
    userId: string,
    target: { userId?: string; email?: string; code?: string },
  ) {
    if (!target.userId && !target.email && !target.code) {
      throw new BadRequestException("Informe o e-mail ou o código de amigo.");
    }

    let targetUser = null;
    if (target.userId) {
      targetUser = await this.prisma.withConnection(() =>
        this.prisma.user.findUnique({
          where: { id: target.userId },
          select: { id: true, deletedAt: true },
        }),
      );
    } else if (target.code) {
      const code = target.code.trim().toUpperCase();
      targetUser = await this.prisma.withConnection(() =>
        this.prisma.user.findFirst({
          where: { friendCode: code, deletedAt: null },
          select: { id: true, deletedAt: true },
        }),
      );
    } else {
      const email = (target.email as string).toLowerCase();
      targetUser = await this.prisma.withConnection(() =>
        this.prisma.user.findFirst({
          where: { email },
          select: { id: true, deletedAt: true },
        }),
      );
    }

    if (!targetUser || targetUser.deletedAt) {
      throw new NotFoundException("Usuário não encontrado");
    }
    if (targetUser.id === userId) {
      throw new BadRequestException("Você não pode adicionar a si mesmo.");
    }

    // Já são amigos?
    const friend = await this.prisma.withConnection(() =>
      this.prisma.friend.findUnique({
        where: {
          ownerId_friendId: { ownerId: userId, friendId: targetUser.id },
        },
      }),
    );
    if (friend) {
      throw new BadRequestException("Vocês já são amigos.");
    }

    // Solicitação pendente existente (em qualquer direção)
    const existing = await this.prisma.withConnection(() =>
      this.prisma.friendRequest.findFirst({
        where: {
          OR: [
            { senderId: userId, recipientId: targetUser.id },
            { senderId: targetUser.id, recipientId: userId },
          ],
        },
      }),
    );
    if (existing) {
      if (existing.status === "pending") {
        throw new ConflictException(
          existing.senderId === userId
            ? "Solicitação já enviada."
            : "Já existe uma solicitação pendente deste usuário.",
        );
      }
      if (existing.status === "accepted") {
        throw new BadRequestException("Vocês já são amigos.");
      }
      // Reutiliza o registro (atualiza para pendente) em vez de duplicar
      const updated = await this.prisma.withConnection(() =>
        this.prisma.friendRequest.update({
          where: { id: existing.id },
          data: { status: "pending", senderId: userId, recipientId: targetUser.id },
        }),
      );
      return { id: updated.id };
    }

    const req = await this.prisma.withConnection(() =>
      this.prisma.friendRequest.create({
        data: { senderId: userId, recipientId: targetUser.id },
      }),
    );
    return { id: req.id };
  }

  async listRequests(userId: string) {
    const requests = await this.prisma.withConnection(() =>
      this.prisma.friendRequest.findMany({
        where: {
          OR: [{ senderId: userId }, { recipientId: userId }],
          status: "pending",
        },
        include: {
          sender: {
            select: { id: true, name: true, email: true, avatarUrl: true, status: true, lastActiveAt: true },
          },
          recipient: {
            select: { id: true, name: true, email: true, avatarUrl: true, status: true, lastActiveAt: true },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
    );

    const now = new Date();
    return requests.map((r): FriendRequestItem => {
      const incoming = r.recipientId === userId;
      const u = incoming ? r.sender : r.recipient;
      return {
        id: r.id,
        status: r.status as FriendRequestItem["status"],
        createdAt: r.createdAt.toISOString(),
        direction: incoming ? "incoming" : "outgoing",
        user: {
          id: u.id,
          name: u.name,
          email: u.email,
          avatarUrl: u.avatarUrl,
          online: this.computePresence(u.status, u.lastActiveAt, now).online,
        },
      };
    });
  }

  async acceptRequest(requestId: string, userId: string) {
    const req = await this.prisma.withConnection(() =>
      this.prisma.friendRequest.findUnique({
        where: { id: requestId },
        include: { sender: true, recipient: true },
      }),
    );
    if (!req || req.recipientId !== userId) {
      throw new NotFoundException("Solicitação não encontrada");
    }
    if (req.status !== "pending") {
      throw new BadRequestException("Solicitação já processada.");
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.friendRequest.update({
        where: { id: requestId },
        data: { status: "accepted" },
      });
      // Relação bidirecional (duas linhas) para consulta simples por usuário.
      for (const [ownerId, friendId] of [
        [req.senderId, req.recipientId],
        [req.recipientId, req.senderId],
      ] as const) {
        const exists = await tx.friend.findUnique({
          where: { ownerId_friendId: { ownerId, friendId } },
          select: { id: true },
        });
        if (!exists) {
          await tx.friend.create({ data: { ownerId, friendId } });
        }
      }
    });
    return { success: true };
  }

  async declineRequest(requestId: string, userId: string) {
    const req = await this.prisma.withConnection(() =>
      this.prisma.friendRequest.findUnique({ where: { id: requestId } }),
    );
    if (!req || req.recipientId !== userId) {
      throw new NotFoundException("Solicitação não encontrada");
    }
    await this.prisma.withConnection(() =>
      this.prisma.friendRequest.update({
        where: { id: requestId },
        data: { status: "declined" },
      }),
    );
    return { success: true };
  }

  async cancelRequest(requestId: string, userId: string) {
    const req = await this.prisma.withConnection(() =>
      this.prisma.friendRequest.findUnique({ where: { id: requestId } }),
    );
    if (!req || req.senderId !== userId) {
      throw new NotFoundException("Solicitação não encontrada");
    }
    await this.prisma.withConnection(() =>
      this.prisma.friendRequest.update({
        where: { id: requestId },
        data: { status: "cancelled" },
      }),
    );
    return { success: true };
  }

  // ── Amigos ──────────────────────────────────────────────────────────────

  async listFriends(userId: string) {
    const friends = await this.prisma.withConnection(() =>
      this.prisma.friend.findMany({
        where: { ownerId: userId },
        include: {
          friend: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
              friendCode: true,
              status: true,
              lastActiveAt: true,
            },
          },
        },
      }),
    );

    const friendIds = friends.map((f) => f.friend.id);
    const now = new Date();

    // Última mensagem de cada conversa + contagem de não lidas
    const lastMessages = friendIds.length
      ? await this.lastMessagePerFriend(userId, friendIds)
      : new Map<string, MessageSummary>();

    const unread = friendIds.length
      ? await this.unreadCounts(userId, friendIds)
      : new Map<string, number>();

    return friends.map((f): FriendListItem => {
      const u = f.friend;
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        avatarUrl: u.avatarUrl,
        friendCode: u.friendCode,
        presence: this.computePresence(u.status, u.lastActiveAt, now),
        lastMessage: lastMessages.get(u.id) ?? null,
        unreadCount: unread.get(u.id) ?? 0,
      };
    });
  }

  private async lastMessagePerFriend(
    userId: string,
    friendIds: string[],
  ): Promise<Map<string, MessageSummary>> {
    const messages = await this.prisma.withConnection(() =>
      this.prisma.directMessage.findMany({
        where: {
          OR: [
            { senderId: userId, recipientId: { in: friendIds } },
            { senderId: { in: friendIds }, recipientId: userId },
          ],
        },
        orderBy: { createdAt: "desc" },
        take: 500,
      }),
    );
    const map = new Map<string, MessageSummary>();
    for (const m of messages) {
      const otherId = m.senderId === userId ? m.recipientId : m.senderId;
      if (!map.has(otherId)) {
        map.set(otherId, {
          id: m.id,
          senderId: m.senderId,
          contentType: m.contentType,
          content: m.content,
          contentRef: m.contentRef,
          createdAt: m.createdAt.toISOString(),
        });
      }
    }
    return map;
  }

  private async unreadCounts(
    userId: string,
    friendIds: string[],
  ): Promise<Map<string, number>> {
    const counts = await this.prisma.withConnection(() =>
      this.prisma.directMessage.groupBy({
        by: ["senderId"],
        where: {
          recipientId: userId,
          senderId: { in: friendIds },
          readAt: null,
        },
        _count: { id: true },
      }),
    );
    return new Map(counts.map((c) => [c.senderId, c._count.id]));
  }

  async removeFriend(userId: string, friendId: string) {
    await this.prisma.$transaction(async (tx) => {
      const del = await tx.friend.deleteMany({
        where: {
          OR: [
            { ownerId: userId, friendId },
            { ownerId: friendId, friendId: userId },
          ],
        },
      });
      if (del.count === 0) {
        throw new NotFoundException("Amizade não encontrada");
      }
      // Mantém o histórico de mensagens; opcionalmente poderia apagar.
    });
    return { success: true };
  }

  // ── Busca de usuários ───────────────────────────────────────────────────

  async searchUsers(userId: string, query: string) {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const users = await this.prisma.withConnection(() =>
      this.prisma.user.findMany({
        where: {
          deletedAt: null,
          id: { not: userId },
          OR: [
            { email: { contains: q } },
            { name: { contains: q } },
            { friendCode: { contains: q } },
          ],
        },
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
          friendCode: true,
          status: true,
          lastActiveAt: true,
        },
        take: 20,
      }),
    );

    const friendIds = await this.prisma.withConnection(() =>
      this.prisma.friend.findMany({
        where: { ownerId: userId },
        select: { friendId: true },
      }),
    );
    const friendSet = new Set(friendIds.map((f) => f.friendId));

    const myId = userId;
    const relationships = await this.prisma.withConnection(() =>
      this.prisma.friendRequest.findMany({
        where: {
          OR: users.map((u) => ({
            OR: [
              { senderId: myId, recipientId: u.id },
              { senderId: u.id, recipientId: myId },
            ],
          })),
        },
        select: { id: true, senderId: true, recipientId: true, status: true },
      }),
    );

    const now = new Date();
    return users.map((u) => {
      let relationship: "none" | "friend" | "outgoing" | "incoming" = "none";
      if (friendSet.has(u.id)) {
        relationship = "friend";
      } else if (relationships.length) {
        const rel = relationships.find(
          (r) => r.senderId === u.id || r.recipientId === u.id,
        );
        if (rel && rel.status === "pending") {
          relationship = rel.recipientId === myId ? "incoming" : "outgoing";
        }
      }
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        avatarUrl: u.avatarUrl,
        friendCode: u.friendCode,
        relationship,
        presence: this.computePresence(u.status, u.lastActiveAt, now),
      };
    });
  }
}
