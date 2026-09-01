import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import mockExamService from '../services/mockExamService';
import { useToastStore } from '../../../store/toastStore';
import { extractApiError } from '../../../utils/api-errors';
import type {
  CreateMockExamInput,
  CreateExamFromQuestionsInput,
  SubmitMockExamInput,
} from '../types';

export function useMockExams(notebookId?: string) {
  return useQuery({
    queryKey: ['mock-exams', notebookId || 'all'],
    queryFn: () => mockExamService.getAll(notebookId),
    staleTime: 30_000,
  });
}

export function useMockExam(id: string) {
  return useQuery({
    queryKey: ['mock-exams', id],
    queryFn: () => mockExamService.getOne(id),
    enabled: !!id,
    staleTime: 30_000,
  });
}

export function useCreateMockExam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateMockExamInput) => mockExamService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mock-exams'] });
      useToastStore.getState().addToast('Simulado criado com sucesso!', 'success');
    },
    onError: (err) => {
      useToastStore.getState().addToast(
        extractApiError(err, 'Erro ao criar simulado'),
        'error',
      );
    },
  });
}

export function useCreateMockExamFromQuestions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateExamFromQuestionsInput) =>
      mockExamService.createFromQuestions(data),
    onSuccess: (exam) => {
      queryClient.invalidateQueries({ queryKey: ['mock-exams'] });
      useToastStore.getState().addToast('Simulado criado com sucesso!', 'success');
      return exam;
    },
    onError: (err) => {
      useToastStore.getState().addToast(
        extractApiError(err, 'Erro ao criar simulado'),
        'error',
      );
    },
  });
}

export function useGenerateMockExam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ notebookId, title }: { notebookId: string; title?: string }) =>
      mockExamService.generateFromNotebook(notebookId, title),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mock-exams'] });
      useToastStore.getState().addToast('Simulado gerado automaticamente!', 'success');
    },
    onError: (err) => {
      useToastStore.getState().addToast(
        extractApiError(err, 'Erro ao gerar simulado'),
        'error',
      );
    },
  });
}

export function useDeleteMockExam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => mockExamService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mock-exams'] });
      useToastStore.getState().addToast('Simulado removido.', 'success');
    },
    onError: (err) => {
      useToastStore.getState().addToast(
        extractApiError(err, 'Erro ao remover simulado'),
        'error',
      );
    },
  });
}

export function useSubmitMockExam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SubmitMockExamInput) =>
      mockExamService.submitAttempt(input.examId, {
        answers: input.answers,
        selfGrades: input.selfGrades,
      }),
    onSuccess: (attempt) => {
      queryClient.invalidateQueries({ queryKey: ['mock-exams'] });
      useToastStore
        .getState()
        .addToast(`Tentativa registrada: ${attempt.correctCount}/${attempt.totalQuestions} acertos`, 'success');
    },
    onError: (err) => {
      useToastStore.getState().addToast(
        extractApiError(err, 'Erro ao registrar tentativa'),
        'error',
      );
    },
  });
}

export function useMockExamAttempts(examId: string) {
  return useQuery({
    queryKey: ['mock-exams', examId, 'attempts'],
    queryFn: () => mockExamService.getAttempts(examId),
    enabled: !!examId,
  });
}
