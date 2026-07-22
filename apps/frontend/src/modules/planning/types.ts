export interface PlanningEvent {
  id: string;
  userId: string;
  title: string;
  description?: string | null;
  date: string;
  time?: string | null;
  type: 'agenda' | 'cronograma';
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface CreateEventInput {
  title: string;
  description?: string;
  date: string;
  time?: string;
  type?: 'agenda' | 'cronograma';
  status?: 'pending' | 'completed' | 'cancelled';
}

export interface UpdateEventInput {
  title?: string;
  description?: string;
  date?: string;
  time?: string;
  type?: 'agenda' | 'cronograma';
  status?: 'pending' | 'completed' | 'cancelled';
}

export interface Goal {
  id: string;
  userId: string;
  title: string;
  description?: string | null;
  targetDate?: string | null;
  progress: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGoalInput {
  title: string;
  description?: string;
  targetDate?: string;
  progress?: number;
}

export interface UpdateGoalInput {
  title?: string;
  description?: string;
  targetDate?: string;
  progress?: number;
}

export interface PomodoroSession {
  id: string;
  userId: string;
  taskName?: string | null;
  duration: number;
  completed: boolean;
  startedAt?: string | null;
  endedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePomodoroInput {
  taskName?: string;
  duration?: number;
}

export interface UpdatePomodoroInput {
  taskName?: string;
  duration?: number;
  completed?: boolean;
}
