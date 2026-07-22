import { api } from '../../../core/api/client.ts';
import type { Todo, CreateTodoInput, UpdateTodoInput } from '../types';

export const todoService = {
  findAll: async (): Promise<Todo[]> => {
    const { data } = await api.get<Todo[]>('/todos');
    return data;
  },

  findOne: async (id: string): Promise<Todo> => {
    const { data } = await api.get<Todo>(`/todos/${id}`);
    return data;
  },

  create: async (input: CreateTodoInput): Promise<Todo> => {
    const { data } = await api.post<Todo>('/todos', input);
    return data;
  },

  update: async (id: string, input: UpdateTodoInput): Promise<Todo> => {
    const { data } = await api.put<Todo>(`/todos/${id}`, input);
    return data;
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`/todos/${id}`);
  },
};
