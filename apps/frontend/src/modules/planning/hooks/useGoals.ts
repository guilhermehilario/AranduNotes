import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { planningService } from '../services/planningService.ts';
import type { Goal, CreateGoalInput, UpdateGoalInput } from '../types';

const GOALS_KEY = ['planning', 'goals'] as const;

export function useGoals() {
  return useQuery({
    queryKey: GOALS_KEY,
    queryFn: planningService.findAllGoals,
    staleTime: 30_000,
  });
}

export function useCreateGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateGoalInput) => planningService.createGoal(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GOALS_KEY });
    },
  });
}

export function useUpdateGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateGoalInput }) =>
      planningService.updateGoal(id, input),
    onMutate: async ({ id, input }) => {
      await queryClient.cancelQueries({ queryKey: GOALS_KEY });
      const previous = queryClient.getQueryData<Goal[]>(GOALS_KEY);

      if (previous) {
        queryClient.setQueryData<Goal[]>(GOALS_KEY, (old) =>
          old?.map((goal) => (goal.id === id ? { ...goal, ...input } : goal)),
        );
      }

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(GOALS_KEY, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: GOALS_KEY });
    },
  });
}

export function useDeleteGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => planningService.removeGoal(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: GOALS_KEY });
      const previous = queryClient.getQueryData<Goal[]>(GOALS_KEY);

      if (previous) {
        queryClient.setQueryData<Goal[]>(GOALS_KEY, (old) =>
          old?.filter((goal) => goal.id !== id),
        );
      }

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(GOALS_KEY, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: GOALS_KEY });
    },
  });
}
