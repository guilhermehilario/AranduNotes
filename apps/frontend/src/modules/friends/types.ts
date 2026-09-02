import { z } from 'zod';

// ── Presença / status ──────────────────────────────────────────────────────
export const PRESENCE_STATUSES = ['available', 'busy', 'invisible', 'offline'] as const;
export type PresenceStatus = (typeof PRESENCE_STATUSES)[number];

export const PRESENCE_LABELS: Record<PresenceStatus, string> = {
  available: 'Disponível',
  busy: 'Ocupado',
  invisible: 'Invisível',
  offline: 'Offline',
};

export const PresenceSchema = z.object({
  online: z.boolean(),
  status: z.enum(PRESENCE_STATUSES),
  lastActiveAt: z.string().datetime().or(z.date()).nullable(),
});
export type Presence = z.infer<typeof PresenceSchema>;

// ── Amigos ─────────────────────────────────────────────────────────────────
export const FriendListItemSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
  avatarUrl: z.string(),
  friendCode: z.string().nullable().optional(),
  presence: PresenceSchema,
  lastMessage: z
    .object({
      id: z.string().uuid(),
      senderId: z.string().uuid(),
      contentType: z.string(),
      content: z.string(),
      contentRef: z.string().nullable(),
      createdAt: z.string().datetime().or(z.date()),
    })
    .nullable(),
  unreadCount: z.number().int().nonnegative(),
});
export type FriendListItem = z.infer<typeof FriendListItemSchema>;

export const FriendRequestItemSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['pending', 'accepted', 'declined', 'cancelled']),
  createdAt: z.string().datetime().or(z.date()),
  user: z.object({
    id: z.string().uuid(),
    name: z.string(),
    email: z.string(),
    avatarUrl: z.string(),
    online: z.boolean(),
  }),
  direction: z.enum(['incoming', 'outgoing']),
});
export type FriendRequestItem = z.infer<typeof FriendRequestItemSchema>;

export const SearchResultSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string(),
  avatarUrl: z.string(),
  friendCode: z.string().nullable().optional(),
  relationship: z.enum(['none', 'friend', 'outgoing', 'incoming']),
  presence: PresenceSchema,
});
export type SearchResult = z.infer<typeof SearchResultSchema>;

// ── Mensagens ──────────────────────────────────────────────────────────────
export const ChatMessageSchema = z.object({
  id: z.string().uuid(),
  senderId: z.string().uuid(),
  recipientId: z.string().uuid(),
  contentType: z.enum(['text', 'content_link']),
  content: z.string(),
  contentRef: z
    .object({
      resourceType: z.string(),
      resourceId: z.string(),
      title: z.string(),
    })
    .nullable(),
  readAt: z.string().datetime().or(z.date()).nullable(),
  createdAt: z.string().datetime().or(z.date()),
});
export type ChatMessage = z.infer<typeof ChatMessageSchema>;

export const ConversationSchema = z.object({
  items: z.array(ChatMessageSchema),
  nextCursor: z.string().nullable(),
});
export type Conversation = z.infer<typeof ConversationSchema>;

export interface SendMessageInput {
  content?: string;
  contentType?: 'text' | 'content_link';
  contentRef?: { resourceType: string; resourceId: string; title: string };
}
