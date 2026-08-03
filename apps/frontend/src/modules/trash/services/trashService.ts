import { api } from '../../../core/api/client';

export interface TrashItem {
  id: string;
  title: string;
  type: 'notebook' | 'leaf' | 'flashcard';
  deletedAt: string;
  color?: string;
  description?: string;
  leavesCount?: number;
  flashcardsCount?: number;
  notebookTitle?: string;
  notebookColor?: string;
  front?: string;
  back?: string;
  leafTitle?: string | null;
}

export interface TrashData {
  notebooks: TrashItem[];
  leaves: TrashItem[];
  flashcards: TrashItem[];
}

export const trashService = {
  async getTrash(): Promise<TrashData> {
    const response = await api.get<TrashData>('/trash');
    return response.data;
  },

  async softDeleteNotebook(notebookId: string): Promise<void> {
    await api.post(`/trash/notebooks/${notebookId}`);
  },

  async softDeleteLeaf(leafId: string): Promise<void> {
    await api.post(`/trash/leaves/${leafId}`);
  },

  async softDeleteFlashcard(cardId: string): Promise<void> {
    await api.post(`/trash/flashcards/${cardId}`);
  },

  async restoreNotebook(notebookId: string): Promise<void> {
    await api.post(`/trash/notebooks/${notebookId}/restore`);
  },

  async restoreLeaf(leafId: string): Promise<void> {
    await api.post(`/trash/leaves/${leafId}/restore`);
  },

  async restoreFlashcard(cardId: string): Promise<void> {
    await api.post(`/trash/flashcards/${cardId}/restore`);
  },

  async permanentDeleteNotebook(notebookId: string): Promise<void> {
    await api.delete(`/trash/notebooks/${notebookId}`);
  },

  async permanentDeleteLeaf(leafId: string): Promise<void> {
    await api.delete(`/trash/leaves/${leafId}`);
  },

  async permanentDeleteFlashcard(cardId: string): Promise<void> {
    await api.delete(`/trash/flashcards/${cardId}`);
  },

  async cleanOldTrash(): Promise<void> {
    // 03/08: backend migrou para DELETE (operação destrutiva) — antes usava POST
    await api.delete('/trash/clean');
  },
};

export default trashService;
