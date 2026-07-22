import { api } from '../../../core/api/client';
import type { Leaf, CreateLeafInput, UpdateLeafInput } from '../types';
import type { Flashcard } from '../../study/types';

export const leafService = {
  async getLeaves(notebookId: string): Promise<Leaf[]> {
    const response = await api.get<Leaf[]>(`/notebooks/${notebookId}/leaves`);
    return response.data;
  },

  async getLeaf(leafId: string): Promise<Leaf> {
    const response = await api.get<Leaf>(`/leaves/${leafId}`);
    return response.data;
  },

  async createLeaf(notebookId: string, data: CreateLeafInput): Promise<Leaf> {
    const response = await api.post<Leaf>(`/notebooks/${notebookId}/leaves`, data);
    return response.data;
  },

  async updateLeaf(leafId: string, data: UpdateLeafInput): Promise<Leaf> {
    const response = await api.put<Leaf>(`/leaves/${leafId}`, data);
    return response.data;
  },

  async deleteLeaf(leafId: string): Promise<void> {
    await api.delete(`/leaves/${leafId}`);
  },

  async generateAISummary(leafId: string): Promise<{ summary: string }> {
    const response = await api.post<{ summary: string }>(`/leaves/${leafId}/summary`);
    return response.data;
  },

  async generateAIFlashcards(leafId: string): Promise<Flashcard[]> {
    const response = await api.post<Flashcard[]>(`/leaves/${leafId}/flashcards`);
    return response.data;
  },

  async archiveLeaf(leafId: string): Promise<Leaf> {
    const response = await api.post<Leaf>(`/leaves/${leafId}/archive`);
    return response.data;
  },

  async unarchiveLeaf(leafId: string): Promise<Leaf> {
    const response = await api.post<Leaf>(`/leaves/${leafId}/unarchive`);
    return response.data;
  },

  async getArchivedLeaves(): Promise<Leaf[]> {
    const response = await api.get<Leaf[]>('/leaves/archived');
    return response.data;
  },

  async reorderLeaves(orderedIds: string[], parentId?: string): Promise<{ success: boolean }> {
    const response = await api.patch<{ success: boolean }>('/leaves/reorder', {
      orderedIds,
      parentId,
    });
    return response.data;
  },
};
export default leafService;
