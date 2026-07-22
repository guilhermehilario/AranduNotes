import { create } from 'zustand';

export interface PlanningNotification {
  id: string;
  type: 'event' | 'goal' | 'pomodoro';
  title: string;
  message: string;
  itemId: string;
  notifiedAt: number;
  acknowledged: boolean;
}

interface NotificationState {
  notifications: PlanningNotification[];
  shownIds: Set<string>; // IDs already notified via native notification
  count: number; // unacknowledged count
  addNotification: (type: PlanningNotification['type'], itemId: string, title: string, message: string) => void;
  markShown: (id: string) => void;
  acknowledge: (id: string) => void;
  acknowledgeAll: () => void;
  removeNotification: (id: string) => void;
  hasBeenShown: (id: string) => boolean;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  shownIds: new Set(),
  count: 0,

  addNotification: (type, itemId, title, message) => {
    const id = `${type}-${itemId}`;
    const state = get();

    // Don't add duplicate notifications
    if (state.notifications.some((n) => n.id === id)) return;

    const notification: PlanningNotification = {
      id,
      type,
      title,
      message,
      itemId,
      notifiedAt: Date.now(),
      acknowledged: false,
    };

    set((s) => ({
      notifications: [...s.notifications, notification],
      count: s.count + 1,
    }));
  },

  markShown: (id) => {
    set((s) => {
      const newShownIds = new Set(s.shownIds);
      newShownIds.add(id);
      return { shownIds: newShownIds };
    });
  },

  acknowledge: (id) => {
    set((s) => ({
      notifications: s.notifications.map((n) =>
        n.id === id ? { ...n, acknowledged: true } : n,
      ),
      count: Math.max(0, s.count - 1),
    }));
  },

  acknowledgeAll: () => {
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, acknowledged: true })),
      count: 0,
    }));
  },

  removeNotification: (id) => {
    set((s) => ({
      notifications: s.notifications.filter((n) => n.id !== id),
      count: Math.max(0, s.count - 1),
    }));
  },

  hasBeenShown: (id) => {
    return get().shownIds.has(id);
  },
}));
