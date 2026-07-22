import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import questionService from '../services/questionService';
import { useToastStore } from '../../../store/toastStore';
import { extractApiError } from '../../../utils/api-errors';
import type { CreateQuestionInput } from '../types';

export function useQuestions(notebookId?: string) {
  return useQuery({
    queryKey: ['questions', notebookId || 'all'],
    queryFn: () => questionService.getAll(notebookId),
    staleTime: 30_000,
  });
}

export function useRandomQuestions(limit: number = 10, notebookId?: string) {
  return useQuery({
    queryKey: ['questions', 'random', notebookId || 'all', limit],
    queryFn: () => questionService.getRandom(limit, notebookId),
    staleTime: 10_000,
    refetchOnMount: true,
  });
}

export function useCreateQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateQuestionInput) => questionService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      useToastStore.getState().addToast('Questão criada com sucesso!', 'success');
    },
    onError: (err) => {
      useToastStore.getState().addToast(
        extractApiError(err, 'Erro ao criar questão'),
        'error',
      );
    },
  });
}

export function useDeleteQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => questionService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      useToastStore.getState().addToast('Questão removida.', 'success');
    },
    onError: (err) => {
      useToastStore.getState().addToast(
        extractApiError(err, 'Erro ao remover questão'),
        'error',
      );
    },
  });
}

export function useGenerateQuestionFromFlashcard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (flashcardId: string) => questionService.generateFromFlashcard(flashcardId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      useToastStore.getState().addToast('Questão gerada a partir do flashcard!', 'success');
    },
    onError: (err) => {
      useToastStore.getState().addToast(
        extractApiError(err, 'Erro ao gerar questão'),
        'error',
      );
    },
  });
}
