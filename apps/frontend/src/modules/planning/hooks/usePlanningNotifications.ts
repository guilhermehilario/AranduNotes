import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { planningService } from '../services/planningService.ts';
import { useNotificationStore } from '../../../store/notificationStore.ts';
import { useToastStore } from '../../../store/toastStore.ts';
import { usePlanningSettingsStore } from '../../../store/planningSettingsStore.ts';
import type { PlanningEvent, Goal, PomodoroSession } from '../types';

const CHECK_INTERVAL = 60_000;
const NOTIFICATION_TIMEOUT = 300_000;

const EVENTS_KEY = ['planning', 'events'];
const GOALS_KEY = ['planning', 'goals'];
const POMODORO_KEY = ['planning', 'pomodoro'];

function requestBrowserPermission() {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  Notification.requestPermission();
  return false;
}

function sendBrowserNotification(title: string, body: string) {
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;
  try {
    new Notification(title, { body, icon: '/vite.svg', silent: false });
  } catch {
    // Silencia erro — notificação nativa é best-effort
  }
}

export function usePlanningNotifications() {
  const queryClient = useQueryClient();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastCheckRef = useRef<Record<string, number>>({});

  const checkNotifications = useCallback(async () => {
    const store = useNotificationStore.getState();
    const settings = usePlanningSettingsStore.getState();
    const now = Date.now();
    const today = new Date().toISOString().split('T')[0];

    const isFirstCheck = Object.keys(lastCheckRef.current).length === 0;
    const canNotifyBrowser = settings.notifyBrowser;

    // ── 1. Events ──
    if (settings.notifyEvents) {
      try {
        const cached = queryClient.getQueryData<PlanningEvent[]>([...EVENTS_KEY, 'agenda']);
        const events = cached && cached.length > 0
          ? cached
          : await planningService.findAllEvents('agenda');

        for (const event of events) {
          if (event.status !== 'pending') continue;
          const eventDate = event.date.split('T')[0];
          if (eventDate !== today) continue;

          const notifId = `event-${event.id}`;
          const lastNotif = lastCheckRef.current[notifId] || 0;
          if (now - lastNotif < NOTIFICATION_TIMEOUT) continue;
          if (store.hasBeenShown(notifId)) continue;

          const timeStr = event.time ? ` às ${event.time}h` : '';
          const title = '📅 Evento Hoje!';
          const message = `${event.title}${timeStr}`;

          store.addNotification('event', event.id, title, message);
          store.markShown(notifId);
          lastCheckRef.current[notifId] = now;

          if (!isFirstCheck) {
            if (canNotifyBrowser) sendBrowserNotification(title, message);
            useToastStore.getState().addToast(`${title} ${message}`, 'info');
          }
        }
      } catch {
        // Silencia — falha na verificação de eventos não deve quebrar o app
      }
    }

    // ── 2. Goals ──
    if (settings.notifyGoals) {
      try {
        const cached = queryClient.getQueryData<Goal[]>(GOALS_KEY);
        const goals = cached && cached.length > 0
          ? cached
          : await planningService.findAllGoals();

        for (const goal of goals) {
          if (goal.progress >= 100) continue;
          if (!goal.targetDate) continue;

          const targetDate = new Date(goal.targetDate);
          const diffMs = targetDate.getTime() - now;
          const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

          if (diffDays > 3 && diffDays > 0) continue;

          const notifId = `goal-${goal.id}`;
          const lastNotif = lastCheckRef.current[notifId] || 0;
          if (now - lastNotif < NOTIFICATION_TIMEOUT) continue;
          if (store.hasBeenShown(notifId)) continue;

          const fmtDate = new Date(goal.targetDate).toLocaleDateString('pt-BR');
          let title: string;
          let message: string;

          if (diffDays < 0) {
            title = '⏰ Meta Atrasada!';
            message = `${goal.title} — prevista para ${fmtDate} (${Math.abs(diffDays)} dia(s) atrás)`;
          } else if (diffDays === 0) {
            title = '🎯 Prazo Final Hoje!';
            message = `${goal.title} — ${goal.progress}% concluída`;
          } else {
            title = '📋 Meta Próxima do Prazo';
            message = `${goal.title} — vence em ${diffDays} dia(s), ${goal.progress}% concluída`;
          }

          store.addNotification('goal', goal.id, title, message);
          store.markShown(notifId);
          lastCheckRef.current[notifId] = now;

          if (!isFirstCheck) {
            if (canNotifyBrowser) sendBrowserNotification(title, message);
            useToastStore.getState().addToast(`${title} ${message}`, 'info');
          }
        }
      } catch {
        // Silencia — falha na verificação de metas não deve quebrar o app
      }
    }

    // ── 3. Pomodoro ──
    if (settings.notifyPomodoro) {
      try {
        const cached = queryClient.getQueryData<PomodoroSession[]>(POMODORO_KEY);
        const pomodoros = cached && cached.length > 0
          ? cached
          : await planningService.findAllPomodoros();

        const recentCompleted = pomodoros.filter((s) => {
          if (!s.completed || !s.endedAt) return false;
          return now - new Date(s.endedAt).getTime() < 120_000;
        });

        for (const session of recentCompleted) {
          const notifId = `pomodoro-${session.id}`;
          const lastNotif = lastCheckRef.current[notifId] || 0;
          if (now - lastNotif < NOTIFICATION_TIMEOUT) continue;
          if (store.hasBeenShown(notifId)) continue;

          const title = '🍅 Pomodoro Concluído!';
          const message = session.taskName
            ? `Você completou ${session.duration}min de foco em "${session.taskName}"`
            : `Você completou ${session.duration}min de foco`;

          store.addNotification('pomodoro', session.id, title, message);
          store.markShown(notifId);
          lastCheckRef.current[notifId] = now;

          if (canNotifyBrowser) sendBrowserNotification(title, message);
          useToastStore.getState().addToast(`${title} ${message}`, 'success');
        }
      } catch {
        // Silencia — falha na verificação de pomodoros não deve quebrar o app
      }
    }
  }, [queryClient]);

  useEffect(() => {
    requestBrowserPermission();

    const initialTimeout = setTimeout(() => checkNotifications(), 3000);
    intervalRef.current = setInterval(checkNotifications, CHECK_INTERVAL);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') checkNotifications();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearTimeout(initialTimeout);
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [checkNotifications]);
}
