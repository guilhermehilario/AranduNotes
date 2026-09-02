import { api } from '../../../core/api/client';
import type {
  Share,
  ShareResourceType,
  InboxItem,
  SetPublicResult,
} from '../types';

export const sharingService = {
  async listShares(
    resourceType: ShareResourceType,
    resourceId: string,
  ): Promise<Share[]> {
    const response = await api.get<Share[]>('/shares', {
      params: { resourceType, resourceId },
    });
    return response.data;
  },

  async createShare(
    resourceType: ShareResourceType,
    resourceId: string,
    email: string,
    leafIds?: string[],
  ): Promise<Share> {
    const response = await api.post<Share>('/shares', {
      resourceType,
      resourceId,
      email,
      ...(leafIds?.length ? { leafIds } : {}),
    });
    return response.data;
  },

  async setShareScope(
    shareId: string,
    leafIds: string[],
  ): Promise<Share> {
    const response = await api.patch<Share>(`/shares/${shareId}/scope`, {
      leafIds,
    });
    return response.data;
  },

  async removeShare(shareId: string): Promise<void> {
    await api.delete(`/shares/${shareId}`);
  },

  async getInbox(): Promise<InboxItem[]> {
    const response = await api.get<InboxItem[]>('/shares/inbox');
    return response.data;
  },

  async setPublic(
    resourceType: ShareResourceType,
    resourceId: string,
    isPublic: boolean,
  ): Promise<SetPublicResult> {
    const response = await api.patch<SetPublicResult>(
      `/shares/${resourceType}/${resourceId}/public`,
      { isPublic },
    );
    return response.data;
  },
};

export default sharingService;