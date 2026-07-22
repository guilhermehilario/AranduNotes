import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { planningService } from '../services/planningService.ts';
import type { PlanningEvent, CreateEventInput, UpdateEventInput } from '../types';

const EVENTS_KEY = ['planning', 'events'] as const;

export function useEvents(type?: string) {
  return useQuery({
    queryKey: [...EVENTS_KEY, type],
    queryFn: () => planningService.findAllEvents(type),
    staleTime: 30_000,
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateEventInput) => planningService.createEvent(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EVENTS_KEY });
    },
  });
}

export function useUpdateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateEventInput }) =>
      planningService.updateEvent(id, input),
    onMutate: async ({ id, input }) => {
      await queryClient.cancelQueries({ queryKey: EVENTS_KEY });
      const previous = queryClient.getQueriesData<PlanningEvent[]>({ queryKey: EVENTS_KEY });

      queryClient.setQueriesData<PlanningEvent[]>({ queryKey: EVENTS_KEY }, (old) =>
        old?.map((event) => (event.id === id ? { ...event, ...input } : event)),
      );

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        context.previous.forEach(([key, data]) => {
          queryClient.setQueryData(key, data);
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: EVENTS_KEY });
    },
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => planningService.removeEvent(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: EVENTS_KEY });
      const previous = queryClient.getQueriesData<PlanningEvent[]>({ queryKey: EVENTS_KEY });

      queryClient.setQueriesData<PlanningEvent[]>({ queryKey: EVENTS_KEY }, (old) =>
        old?.filter((event) => event.id !== id),
      );

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        context.previous.forEach(([key, data]) => {
          queryClient.setQueryData(key, data);
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: EVENTS_KEY });
    },
  });
}
