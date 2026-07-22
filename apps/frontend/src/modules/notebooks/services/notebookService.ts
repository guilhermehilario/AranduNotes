import { api } from '../../../core/api/client';
import type { Notebook, CreateNotebookInput, UpdateNotebookInput } from '../types';

export const notebookService = {
  async getNotebooks(): Promise<Notebook[]> {
    const response = await api.get<Notebook[]>('/notebooks');
    return response.data;
  },

  async getNotebook(id: string): Promise<Notebook> {
    const response = await api.get<Notebook>(`/notebooks/${id}`);
    return response.data;
  },

  async createNotebook(data: CreateNotebookInput): Promise<Notebook> {
    const response = await api.post<Notebook>('/notebooks', data);
    return response.data;
  },

  async updateNotebook(id: string, data: UpdateNotebookInput): Promise<Notebook> {
    const response = await api.put<Notebook>(`/notebooks/${id}`, data);
    return response.data;
  },

  async deleteNotebook(id: string): Promise<void> {
    await api.delete(`/notebooks/${id}`);
  },
};
export default notebookService;
