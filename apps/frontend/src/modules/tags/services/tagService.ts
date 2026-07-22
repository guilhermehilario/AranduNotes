import { api } from '../../../core/api/client';
import type { Tag } from '../types';

export const tagService = {
  async getTags(): Promise<Tag[]> {
    const response = await api.get<Tag[]>('/tags');
    return response.data;
  },

  async createTag(data: { name: string; color?: string }): Promise<Tag> {
    const response = await api.post<Tag>('/tags', data);
    return response.data;
  },

  async updateTag(id: string, data: { name?: string; color?: string }): Promise<Tag> {
    const response = await api.put<Tag>(`/tags/${id}`, data);
    return response.data;
  },

  async deleteTag(id: string): Promise<void> {
    await api.delete(`/tags/${id}`);
  },

  async getLeafTags(leafId: string): Promise<Tag[]> {
    const response = await api.get<Tag[]>(`/leaves/${leafId}/tags`);
    return response.data;
  },

  async addTagToLeaf(leafId: string, tagId: string): Promise<void> {
    await api.post(`/leaves/${leafId}/tags/${tagId}`);
  },

  async removeTagFromLeaf(leafId: string, tagId: string): Promise<void> {
    await api.delete(`/leaves/${leafId}/tags/${tagId}`);
  },
};

export default tagService;
