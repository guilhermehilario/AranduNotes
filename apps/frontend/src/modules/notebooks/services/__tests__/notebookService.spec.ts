import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Mock } from 'vitest';

// Mock do axios - deve vir antes do import do serviço
vi.mock('../../../../core/api/client', () => {
  const mockAxiosInstance = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
    defaults: {
      baseURL: 'http://localhost:3000/api',
    },
  };

  return {
    api: mockAxiosInstance,
  };
});

import { api } from '../../../../core/api/client';
import { notebookService } from '../notebookService';
import type { Notebook, UpdateNotebookInput } from '../../types';

describe('notebookService', () => {
  const mockNotebook: Notebook = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    userId: '660e8400-e29b-41d4-a716-446655440001',
    title: 'Engenharia de Software',
    description: 'Anotações da disciplina',
    color: '#FF5733',
    createdAt: '2026-07-01T00:00:00.000Z',
    updatedAt: '2026-07-05T00:00:00.000Z',
    leavesCount: 5,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('updateNotebook', () => {
    it('deve enviar PUT para /notebooks/:id com os dados corretos', async () => {
      const updateData: UpdateNotebookInput = {
        title: 'Novo Título',
        description: 'Nova descrição',
        color: '#3366FF',
      };

      const updatedNotebook = { ...mockNotebook, ...updateData };
      (api.put as Mock).mockResolvedValue({ data: updatedNotebook });

      const result = await notebookService.updateNotebook(mockNotebook.id, updateData);

      expect(api.put).toHaveBeenCalledWith(
        `/notebooks/${mockNotebook.id}`,
        updateData,
      );
      expect(result).toEqual(updatedNotebook);
    });

    it('deve enviar PUT apenas com campos parciais', async () => {
      const partialUpdate: UpdateNotebookInput = {
        title: 'Apenas título alterado',
      };

      const partiallyUpdated = { ...mockNotebook, title: 'Apenas título alterado' };
      (api.put as Mock).mockResolvedValue({ data: partiallyUpdated });

      const result = await notebookService.updateNotebook(mockNotebook.id, partialUpdate);

      expect(api.put).toHaveBeenCalledWith(
        `/notebooks/${mockNotebook.id}`,
        partialUpdate,
      );
      expect(result.title).toBe('Apenas título alterado');
    });

    it('deve propagar erro quando a API falha', async () => {
      const apiError = new Error('Erro interno do servidor');
      (api.put as Mock).mockRejectedValue(apiError);

      await expect(
        notebookService.updateNotebook(mockNotebook.id, { title: 'Falha' }),
      ).rejects.toThrow('Erro interno do servidor');
    });
  });

  describe('deleteNotebook (hard delete)', () => {
    it('deve enviar DELETE para /notebooks/:id', async () => {
      (api.delete as Mock).mockResolvedValue({});

      await notebookService.deleteNotebook(mockNotebook.id);

      expect(api.delete).toHaveBeenCalledWith(`/notebooks/${mockNotebook.id}`);
    });
  });
});
