import { api } from '../../../core/api/client.ts';
import type {
  PlanningEvent,
  CreateEventInput,
  UpdateEventInput,
  Goal,
  CreateGoalInput,
  UpdateGoalInput,
  PomodoroSession,
  CreatePomodoroInput,
  UpdatePomodoroInput,
} from '../types';

export const planningService = {
  // ── Events (Agenda + Cronograma) ──
  findAllEvents: async (type?: string): Promise<PlanningEvent[]> => {
    const params = type ? { type } : {};
    const { data } = await api.get<PlanningEvent[]>('/planning/events', { params });
    return data;
  },

  createEvent: async (input: CreateEventInput): Promise<PlanningEvent> => {
    const { data } = await api.post<PlanningEvent>('/planning/events', input);
    return data;
  },

  updateEvent: async (id: string, input: UpdateEventInput): Promise<PlanningEvent> => {
    const { data } = await api.put<PlanningEvent>(`/planning/events/${id}`, input);
    return data;
  },

  removeEvent: async (id: string): Promise<void> => {
    await api.delete(`/planning/events/${id}`);
  },

  // ── Goals (Metas) ──
  findAllGoals: async (): Promise<Goal[]> => {
    const { data } = await api.get<Goal[]>('/planning/goals');
    return data;
  },

  createGoal: async (input: CreateGoalInput): Promise<Goal> => {
    const { data } = await api.post<Goal>('/planning/goals', input);
    return data;
  },

  updateGoal: async (id: string, input: UpdateGoalInput): Promise<Goal> => {
    const { data } = await api.put<Goal>(`/planning/goals/${id}`, input);
    return data;
  },

  removeGoal: async (id: string): Promise<void> => {
    await api.delete(`/planning/goals/${id}`);
  },

  // ── Pomodoro Sessions ──
  findAllPomodoros: async (): Promise<PomodoroSession[]> => {
    const { data } = await api.get<PomodoroSession[]>('/planning/pomodoro');
    return data;
  },

  createPomodoro: async (input: CreatePomodoroInput): Promise<PomodoroSession> => {
    const { data } = await api.post<PomodoroSession>('/planning/pomodoro', input);
    return data;
  },

  updatePomodoro: async (id: string, input: UpdatePomodoroInput): Promise<PomodoroSession> => {
    const { data } = await api.put<PomodoroSession>(`/planning/pomodoro/${id}`, input);
    return data;
  },

  removePomodoro: async (id: string): Promise<void> => {
    await api.delete(`/planning/pomodoro/${id}`);
  },
};
