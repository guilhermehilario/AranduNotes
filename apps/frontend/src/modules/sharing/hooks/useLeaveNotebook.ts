import { useMutation, useQueryClient } from '@tanstack/react-query';
import sharingService from '../services/sharingService';
import { useToastStore } from '../../../store/toastStore';
import { extractApiError } from '../../../utils/api-errors';

export function useLeaveNotebook() {
  const queryClient = useQueryClient();

  const leaveMutation = useMutation({
    mutationFn: (notebookId: string) => sharingService.leaveNotebook(notebookId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notebooks'] });
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
      useToastStore.getState().addToast(
        'Você cancelou o compartilhamento deste caderno.',
        'success',
      );
    },
    onError: (err) => {
      useToastStore.getState().addToast(
        extractApiError(err, 'Erro ao cancelar o compartilhamento.'),
        'error',
      );
    },
  });

  return {
    leaveNotebook: leaveMutation.mutateAsync,
    isLeaving: leaveMutation.isPending,
  };
}
