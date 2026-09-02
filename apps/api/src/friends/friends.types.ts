export const PRESENCE_STATUSES = [
  "available",
  "busy",
  "invisible",
  "offline",
] as const;

export type PresenceStatus = (typeof PRESENCE_STATUSES)[number];

/** Janela (ms) em que um usuário é considerado "online" após o último heartbeat. */
export const ONLINE_WINDOW_MS = 90_000;

export interface FriendPresence {
  online: boolean;
  status: PresenceStatus;
  lastActiveAt: string | null;
}

export interface FriendListItem {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  friendCode: string | null;
  presence: FriendPresence;
  lastMessage: MessageSummary | null;
  unreadCount: number;
}

export interface FriendRequestItem {
  id: string;
  status: "pending" | "accepted" | "declined" | "cancelled";
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string;
    online: boolean;
  };
  direction: "incoming" | "outgoing";
}

export interface MessageSummary {
  id: string;
  senderId: string;
  contentType: string;
  content: string;
  contentRef: string | null;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  recipientId: string;
  contentType: string;
  content: string;
  contentRef: { resourceType: string; resourceId: string; title: string } | null;
  readAt: string | null;
  createdAt: string;
}
