import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import type { Mock } from 'vitest';

// ── Mocks (paths relativos ao arquivo em src/modules/notebooks/hooks/__tests__/) ──

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
import { useNotebook } from '../useNotebooks';
import { useSoftDeleteNotebook } from '../../../trash/hooks/useTrash';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };
}

const NOTEBOOK_ID = '550e8400-e29b-41d4-a716-446655440000';
const MOCK_NOTEBOOK = {
  id: NOTEBOOK_ID,
  userId: '660e8400-e29b-41d4-a716-446655440001',
  title: 'Engenharia de Software',
  description: 'Anotações da disciplina',
  color: '#FF5733',
  createdAt: '2026-07-01T00:00:00.000Z',
  updatedAt: '2026-07-05T00:00:00.000Z',
  leavesCount: 5,
};

describe('useNotebook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (api.get as Mock).mockResolvedValue({ data: MOCK_NOTEBOOK });
  });

  describe('updateNotebook', () => {
    it('deve chamar a service de update com os dados corretos', async () => {
      (api.put as Mock).mockResolvedValue({
        data: { ...MOCK_NOTEBOOK, title: 'Título Atualizado' },
      });

      const { result } = renderHook(() => useNotebook(NOTEBOOK_ID), {
        wrapper: createWrapper(),
      });

      // Aguarda a query inicial carregar
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      // Executa a mutation
      await result.current.updateNotebook({ title: 'Título Atualizado' });

      expect(api.put).toHaveBeenCalledWith(
        `/notebooks/${NOTEBOOK_ID}`,
        { title: 'Título Atualizado' },
      );
    });

    it('deve atualizar o cache após update bem-sucedido', async () => {
      const updatedNotebook = { ...MOCK_NOTEBOOK, title: 'Título Atualizado' };
      (api.put as Mock).mockResolvedValue({ data: updatedNotebook });

      const { result } = renderHook(() => useNotebook(NOTEBOOK_ID), {
        wrapper: createWrapper(),
      });

      // Aguarda a query inicial carregar com dados iniciais
      await waitFor(() => expect(result.current.notebook?.id).toBe(NOTEBOOK_ID));

      // Executa a mutation
      await result.current.updateNotebook({ title: 'Título Atualizado' });

      // O cache deve ter o dado atualizado
      await waitFor(() => {
        expect(result.current.notebook?.title).toBe('Título Atualizado');
      });
    });

    it('deve propagar erro quando a mutation falha', async () => {
      (api.put as Mock).mockRejectedValue(new Error('Falha na atualização'));

      const { result } = renderHook(() => useNotebook(NOTEBOOK_ID), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await expect(
        result.current.updateNotebook({ title: 'Falha' }),
      ).rejects.toThrow('Falha na atualização');
    });
  });
});

describe('useSoftDeleteNotebook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve chamar POST /trash/notebooks/:id com o id correto', async () => {
    (api.post as Mock).mockResolvedValue({});

    const { result } = renderHook(() => useSoftDeleteNotebook(), {
      wrapper: createWrapper(),
    });

    await result.current.mutateAsync(NOTEBOOK_ID);

    expect(api.post).toHaveBeenCalledWith(`/trash/notebooks/${NOTEBOOK_ID}`);
  });

  it('deve propagar erro quando o soft delete falha', async () => {
    (api.post as Mock).mockRejectedValue(new Error('Caderno não encontrado'));

    const { result } = renderHook(() => useSoftDeleteNotebook(), {
      wrapper: createWrapper(),
    });

    await expect(
      result.current.mutateAsync(NOTEBOOK_ID),
    ).rejects.toThrow('Caderno não encontrado');
  });
});
