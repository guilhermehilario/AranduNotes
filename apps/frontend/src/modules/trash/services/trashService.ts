import { api } from '../../../core/api/client';

export interface TrashItem {
  id: string;
  title: string;
  type: 'notebook' | 'leaf';
  deletedAt: string;
  color?: string;
  description?: string;
  leavesCount?: number;
  flashcardsCount?: number;
  notebookTitle?: string;
  notebookColor?: string;
}

export interface TrashData {
  notebooks: TrashItem[];
  leaves: TrashItem[];
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

  async restoreNotebook(notebookId: string): Promise<void> {
    await api.post(`/trash/notebooks/${notebookId}/restore`);
  },

  async restoreLeaf(leafId: string): Promise<void> {
    await api.post(`/trash/leaves/${leafId}/restore`);
  },

  async permanentDeleteNotebook(notebookId: string): Promise<void> {
    await api.delete(`/trash/notebooks/${notebookId}`);
  },

  async permanentDeleteLeaf(leafId: string): Promise<void> {
    await api.delete(`/trash/leaves/${leafId}`);
  },

  async cleanOldTrash(): Promise<void> {
    await api.post('/trash/clean');
  },
};

export default trashService;
