import { api } from '../../../core/api/client';
import type {
  ChatMessage,
  Conversation,
  FriendListItem,
  FriendRequestItem,
  Presence,
  PresenceStatus,
  SearchResult,
  SendMessageInput,
} from '../types';

export const friendsService = {
  // Presença
  async getMyPresence(): Promise<Presence> {
    const r = await api.get<Presence>('/friends/presence/me');
    return r.data;
  },
  async setStatus(status: PresenceStatus): Promise<{ status: string }> {
    const r = await api.put<{ status: string }>('/friends/status', { status });
    return r.data;
  },
  async heartbeat(): Promise<void> {
    await api.post('/friends/heartbeat');
  },

  // Solicitações
  async getMyCode(): Promise<{ code: string }> {
    const r = await api.get<{ code: string }>('/friends/code');
    return r.data;
  },
  async listRequests(): Promise<FriendRequestItem[]> {
    const r = await api.get<FriendRequestItem[]>('/friends/requests');
    return r.data;
  },
  async sendRequest(input: { email?: string; code?: string }): Promise<{ id: string }> {
    const r = await api.post<{ id: string }>('/friends/requests', input);
    return r.data;
  },
  async acceptRequest(requestId: string): Promise<void> {
    await api.post(`/friends/requests/${requestId}/accept`);
  },
  async declineRequest(requestId: string): Promise<void> {
    await api.post(`/friends/requests/${requestId}/decline`);
  },
  async cancelRequest(requestId: string): Promise<void> {
    await api.post(`/friends/requests/${requestId}/cancel`);
  },

  // Amigos
  async listFriends(): Promise<FriendListItem[]> {
    const r = await api.get<FriendListItem[]>('/friends');
    return r.data;
  },
  async removeFriend(friendId: string): Promise<void> {
    await api.delete(`/friends/${friendId}`);
  },
  async searchUsers(q: string): Promise<SearchResult[]> {
    const r = await api.get<SearchResult[]>('/friends/search', { params: { q } });
    return r.data;
  },

  // Mensagens
  async listMessages(
    friendId: string,
    cursor?: string,
  ): Promise<Conversation> {
    const r = await api.get<Conversation>(`/friends/${friendId}/messages`, {
      params: cursor ? { cursor } : undefined,
    });
    return r.data;
  },
  async sendMessage(friendId: string, input: SendMessageInput): Promise<ChatMessage> {
    const r = await api.post<ChatMessage>(`/friends/${friendId}/messages`, input);
    return r.data;
  },
  async markRead(friendId: string): Promise<void> {
    await api.post(`/friends/${friendId}/read`);
  },
};

export default friendsService;
