import { api } from '../../../core/api/client';
import type { Bookmark } from '../types';

export const bookmarkService = {
  async getBookmarks(): Promise<Bookmark[]> {
    const response = await api.get<Bookmark[]>('/bookmarks');
    return response.data;
  },

  async createBookmark(data: {
    leafId?: string;
    notebookId?: string;
    title: string;
    path: string;
  }): Promise<Bookmark> {
    const response = await api.post<Bookmark>('/bookmarks', data);
    return response.data;
  },

  async deleteBookmark(id: string): Promise<void> {
    await api.delete(`/bookmarks/${id}`);
  },
};

export default bookmarkService;
