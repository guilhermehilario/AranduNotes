import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { planningService } from '../services/planningService.ts';
import type { PomodoroSession, CreatePomodoroInput, UpdatePomodoroInput } from '../types';

const POMODORO_KEY = ['planning', 'pomodoro'] as const;

export function usePomodoros() {
  return useQuery({
    queryKey: POMODORO_KEY,
    queryFn: planningService.findAllPomodoros,
    staleTime: 30_000,
  });
}

export function useCreatePomodoro() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreatePomodoroInput) => planningService.createPomodoro(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: POMODORO_KEY });
    },
  });
}

export function useUpdatePomodoro() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdatePomodoroInput }) =>
      planningService.updatePomodoro(id, input),
    onMutate: async ({ id, input }) => {
      await queryClient.cancelQueries({ queryKey: POMODORO_KEY });
      const previous = queryClient.getQueryData<PomodoroSession[]>(POMODORO_KEY);

      if (previous) {
        queryClient.setQueryData<PomodoroSession[]>(POMODORO_KEY, (old) =>
          old?.map((session) =>
            session.id === id ? { ...session, ...input } : session,
          ),
        );
      }

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(POMODORO_KEY, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: POMODORO_KEY });
    },
  });
}

export function useDeletePomodoro() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => planningService.removePomodoro(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: POMODORO_KEY });
      const previous = queryClient.getQueryData<PomodoroSession[]>(POMODORO_KEY);

      if (previous) {
        queryClient.setQueryData<PomodoroSession[]>(POMODORO_KEY, (old) =>
          old?.filter((session) => session.id !== id),
        );
      }

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(POMODORO_KEY, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: POMODORO_KEY });
    },
  });
}
