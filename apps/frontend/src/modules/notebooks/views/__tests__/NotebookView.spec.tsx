import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { ReactNode } from 'react';
import { NotebookView } from '../NotebookView';

// ── Mocks (paths relativos ao arquivo em src/modules/notebooks/views/__tests__/) ──

vi.mock('../../hooks/useNotebooks', () => ({
  useNotebook: vi.fn(),
}));

vi.mock('../../../leaves/hooks/useLeaves', () => ({
  useLeaves: vi.fn(),
}));

vi.mock('../../../study/hooks/useFlashcards', () => ({
  useNotebookFlashcards: vi.fn(),
}));

vi.mock('../../../bookmarks/hooks/useToggleBookmark', () => ({
  useToggleBookmark: vi.fn(),
}));

vi.mock('../../../trash/hooks/useTrash', () => ({
  useSoftDeleteNotebook: vi.fn(),
}));

vi.mock('../../../../store/editorStatusStore', () => ({
  useEditorStatusStore: vi.fn(),
}));

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
    defaults: { baseURL: 'http://localhost:3000/api' },
  };
  return { api: mockAxiosInstance };
});

// ── Imports dos módulos mockados ──

import { useNotebook } from '../../hooks/useNotebooks';
import { useLeaves } from '../../../leaves/hooks/useLeaves';
import { useNotebookFlashcards } from '../../../study/hooks/useFlashcards';
import { useToggleBookmark } from '../../../bookmarks/hooks/useToggleBookmark';
import { useSoftDeleteNotebook } from '../../../trash/hooks/useTrash';
import { useEditorStatusStore } from '../../../../store/editorStatusStore';

// ── Dados de exemplo ──

const NOTEBOOK_ID = '550e8400-e29b-41d4-a716-446655440000';
const MOCK_NOTEBOOK = {
  id: NOTEBOOK_ID,
  userId: '660e8400-e29b-41d4-a716-446655440001',
  title: 'Engenharia de Software',
  description: 'Anotações da disciplina de ES',
  color: '#FF5733',
  createdAt: '2026-07-01T00:00:00.000Z',
  updatedAt: '2026-07-05T00:00:00.000Z',
  leavesCount: 3,
};

const mockLeaves = [
  {
    id: 'leaf-1',
    notebookId: NOTEBOOK_ID,
    title: 'Aula 01 - Introdução',
    content: '<p>Conteúdo da aula</p>',
    rawText: 'Conteúdo da aula',
    createdAt: '2026-07-02T00:00:00.000Z',
    updatedAt: '2026-07-02T00:00:00.000Z',
    position: 0,
    parentId: null,
    archivedAt: null,
    deletedAt: null,
    tags: [],
    children: [],
  },
];

// ── Helpers ──

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
        <MemoryRouter initialEntries={[`/notebooks/${NOTEBOOK_ID}`]}>
          <Routes>
            <Route path="/notebooks/:notebookId" element={children} />
            <Route path="/dashboard" element={<div>Dashboard Page</div>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );
  };
}

function setupMocks({
  updateNotebook = vi.fn().mockResolvedValue(MOCK_NOTEBOOK),
  softDeleteMutation = { mutateAsync: vi.fn().mockResolvedValue(undefined) },
  notebook = MOCK_NOTEBOOK,
  leaves = mockLeaves,
  flashcards = [],
  isBookmarked = false,
  toggleBookmark = vi.fn(),
}: {
  updateNotebook?: ReturnType<typeof vi.fn>;
  softDeleteMutation?: { mutateAsync: ReturnType<typeof vi.fn> };
  notebook?: typeof MOCK_NOTEBOOK | undefined;
  leaves?: typeof mockLeaves;
  flashcards?: unknown[];
  isBookmarked?: boolean;
  toggleBookmark?: ReturnType<typeof vi.fn>;
} = {}) {
  vi.mocked(useNotebook).mockReturnValue({
    notebook,
    isLoading: false,
    error: null,
    updateNotebook: updateNotebook as any,
    isUpdating: false,
  });

  vi.mocked(useLeaves).mockReturnValue({
    leaves,
    isLoading: false,
    error: null,
    createLeaf: vi.fn(),
    isCreating: false,
  } as any);

  vi.mocked(useNotebookFlashcards).mockReturnValue({
    data: flashcards as any,
    isLoading: false,
  } as any);

  vi.mocked(useToggleBookmark).mockReturnValue({
    isBookmarked,
    toggleBookmark,
  } as any);

  vi.mocked(useSoftDeleteNotebook).mockReturnValue(softDeleteMutation as any);

  vi.mocked(useEditorStatusStore).mockReturnValue({
    show: vi.fn(),
    hide: vi.fn(),
    setLastUpdate: vi.fn(),
    isVisible: true,
  });

  return { updateNotebook, softDeleteMutation };
}

// ── Testes ──

describe('NotebookView - Editar Caderno', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve renderizar o cabeçalho com os dados do caderno', async () => {
    setupMocks();

    render(<NotebookView />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Engenharia de Software')).toBeInTheDocument();
    });

    expect(
      screen.getByText('Anotações da disciplina de ES'),
    ).toBeInTheDocument();
  });

  it('deve abrir o modal de edição ao clicar no botão Editar', async () => {
    setupMocks();
    const user = userEvent.setup();

    render(<NotebookView />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Engenharia de Software')).toBeInTheDocument();
    });

    // Clica no botão Editar
    const editButton = screen.getByRole('button', { name: /editar/i });
    await user.click(editButton);

    // O modal deve ter aberto com o título do caderno
    await waitFor(() => {
      expect(screen.getByText('Editar Caderno')).toBeInTheDocument();
    });

    // O campo de título deve estar preenchido
    const titleInput = screen.getByLabelText('Título do Caderno');
    expect(titleInput).toHaveValue('Engenharia de Software');
  });

  it('deve salvar alterações ao submeter o formulário de edição', async () => {
    const updateNotebook = vi.fn().mockResolvedValue({
      ...MOCK_NOTEBOOK,
      title: 'Engenharia de Software II',
    });
    setupMocks({ updateNotebook });
    const user = userEvent.setup();

    render(<NotebookView />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Engenharia de Software')).toBeInTheDocument();
    });

    // Abre o modal de edição
    await user.click(screen.getByRole('button', { name: /editar/i }));
    await waitFor(() => {
      expect(screen.getByText('Editar Caderno')).toBeInTheDocument();
    });

    // Altera o título
    const titleInput = screen.getByLabelText('Título do Caderno');
    await user.clear(titleInput);
    await user.type(titleInput, 'Engenharia de Software II');

    // Submete o formulário
    await user.click(
      screen.getByRole('button', { name: /salvar alterações/i }),
    );

    await waitFor(() => {
      expect(updateNotebook).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Engenharia de Software II',
          color: MOCK_NOTEBOOK.color,
        }),
      );
    });
  });

  it('deve exibir erro no modal quando a edição falha', async () => {
    const updateNotebook = vi.fn().mockRejectedValue(
      new Error('Erro ao atualizar caderno'),
    );
    setupMocks({ updateNotebook });

    render(<NotebookView />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Engenharia de Software')).toBeInTheDocument();
    });

    // Abre modal e clica em salvar sem alterar nada
    await userEvent.click(screen.getByRole('button', { name: /editar/i }));
    await waitFor(() => {
      expect(screen.getByText('Editar Caderno')).toBeInTheDocument();
    });

    await userEvent.click(
      screen.getByRole('button', { name: /salvar alterações/i }),
    );

    await waitFor(() => {
      expect(
        screen.getByText('Erro ao atualizar caderno'),
      ).toBeInTheDocument();
    });
  });
});

describe('NotebookView - Excluir Caderno', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve abrir o diálogo de confirmação ao clicar em Excluir', async () => {
    setupMocks();
    const user = userEvent.setup();

    render(<NotebookView />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Engenharia de Software')).toBeInTheDocument();
    });

    // Clica em Excluir
    const deleteButton = screen.getByRole('button', { name: /excluir/i });
    await user.click(deleteButton);

    // O ConfirmDialog deve aparecer
    await waitFor(() => {
      expect(screen.getByText('Excluir Caderno?')).toBeInTheDocument();
    });
  });

  it('deve chamar softDeleteNotebook ao confirmar exclusão', async () => {
    const softDeleteMutation = {
      mutateAsync: vi.fn().mockResolvedValue(undefined),
    };
    setupMocks({ softDeleteMutation });
    const user = userEvent.setup();

    render(<NotebookView />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Engenharia de Software')).toBeInTheDocument();
    });

    // Clica em Excluir
    await user.click(screen.getByRole('button', { name: /excluir/i }));

    // Confirma a exclusão
    await waitFor(() => {
      expect(screen.getByText('Excluir Caderno?')).toBeInTheDocument();
    });

    await user.click(
      screen.getByRole('button', { name: /sim, mover para lixeira/i }),
    );

    await waitFor(() => {
      expect(softDeleteMutation.mutateAsync).toHaveBeenCalledWith(NOTEBOOK_ID);
    });
  });

  it('deve exibir erro global quando a exclusão falha', async () => {
    const softDeleteMutation = {
      mutateAsync: vi
        .fn()
        .mockRejectedValue(new Error('Caderno não encontrado')),
    };
    setupMocks({ softDeleteMutation });
    const user = userEvent.setup();

    render(<NotebookView />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Engenharia de Software')).toBeInTheDocument();
    });

    // Clica em Excluir e confirma
    await user.click(screen.getByRole('button', { name: /excluir/i }));
    await waitFor(() => {
      expect(screen.getByText('Excluir Caderno?')).toBeInTheDocument();
    });

    await user.click(
      screen.getByRole('button', { name: /sim, mover para lixeira/i }),
    );

    await waitFor(() => {
      expect(
        screen.getByText('Caderno não encontrado'),
      ).toBeInTheDocument();
    });
  });
});
