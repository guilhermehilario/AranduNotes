import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { todoService } from '../services/todoService.ts';
import type { Todo, CreateTodoInput, UpdateTodoInput } from '../types';

const TODOS_KEY = ['todos'] as const;

export function useTodos() {
  return useQuery({
    queryKey: TODOS_KEY,
    queryFn: todoService.findAll,
  });
}

export function useCreateTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateTodoInput) => todoService.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TODOS_KEY });
    },
  });
}

export function useUpdateTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateTodoInput }) =>
      todoService.update(id, input),
    onMutate: async ({ id, input }) => {
      await queryClient.cancelQueries({ queryKey: TODOS_KEY });
      const previous = queryClient.getQueryData<Todo[]>(TODOS_KEY);

      if (previous) {
        queryClient.setQueryData<Todo[]>(TODOS_KEY, (old) =>
          old?.map((todo) =>
            todo.id === id ? { ...todo, ...input } : todo,
          ),
        );
      }

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(TODOS_KEY, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: TODOS_KEY });
    },
  });
}

export function useDeleteTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => todoService.remove(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: TODOS_KEY });
      const previous = queryClient.getQueryData<Todo[]>(TODOS_KEY);

      if (previous) {
        queryClient.setQueryData<Todo[]>(TODOS_KEY, (old) =>
          old?.filter((todo) => todo.id !== id),
        );
      }

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(TODOS_KEY, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: TODOS_KEY });
    },
  });
}
