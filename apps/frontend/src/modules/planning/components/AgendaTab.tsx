import React, { useState, useCallback } from 'react';
import {
  Plus,
  Trash2,
  Loader2,
  Circle,
  CheckCircle2,
  Clock,
  Calendar as CalendarIcon,
  ListChecks,
} from 'lucide-react';
import { useEvents, useCreateEvent, useUpdateEvent, useDeleteEvent } from '../hooks/useEvents.ts';
import { EmptyState } from '../../../components/ui/EmptyState.tsx';
import { LoadingScreen } from '../../../components/ui/LoadingScreen.tsx';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog.tsx';
import { useToastStore } from '../../../store/toastStore.ts';
import { extractApiError } from '../../../utils/api-errors.ts';

const STATUS_ICONS: Record<string, React.FC<{ className?: string }>> = {
  pending: Circle,
  completed: CheckCircle2,
  cancelled: Circle,
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'text-amber-500',
  completed: 'text-emerald-500',
  cancelled: 'text-slate-400',
};

export const AgendaTab: React.FC = () => {
  const { data: events = [], isLoading } = useEvents('agenda');
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();

  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [newTime, setNewTime] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleAdd = useCallback(async () => {
    const title = newTitle.trim();
    if (!title) return;
    try {
      await createEvent.mutateAsync({
        title,
        date: newDate,
        time: newTime || undefined,
        type: 'agenda',
      });
      setNewTitle('');
      setNewTime('');
      setShowForm(false);
    } catch (err) {
      useToastStore.getState().addToast(extractApiError(err, 'Erro ao criar evento.'), 'error');
    }
  }, [newTitle, newDate, newTime, createEvent]);

  const handleToggleStatus = useCallback(
    (id: string, currentStatus: string) => {
      const nextStatus = currentStatus === 'pending' ? 'completed' : 'pending';
      updateEvent.mutate({ id, input: { status: nextStatus } });
    },
    [updateEvent],
  );

  const handleDelete = useCallback(
    (id: string) => {
      deleteEvent.mutate(id);
      setDeleteConfirmId(null);
    },
    [deleteEvent],
  );

  if (isLoading) return <LoadingScreen />;

  const today = new Date().toISOString().split('T')[0];
  const todayEvents = events.filter((e) => e.date.startsWith(today));
  const upcomingEvents = events.filter((e) => e.date > today);

  return (
    <div className="flex flex-col gap-6">
      {/* Quick Add Button */}
      {!showForm && (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-dark-900 border border-dashed border-slate-300 dark:border-dark-700 rounded-2xl text-slate-500 dark:text-dark-400 hover:border-violet-400 hover:text-violet-500 transition-all cursor-pointer"
        >
          <Plus className="h-5 w-5" />
          <span className="text-sm font-semibold">Adicionar evento na agenda</span>
        </button>
      )}

      {/* Add Form */}
      {showForm && (
        <div className="flex flex-col gap-3 p-4 bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-800 rounded-2xl">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Título do evento..."
            className="w-full px-4 py-3 bg-slate-50 dark:bg-dark-950 border border-slate-200 dark:border-dark-800 rounded-xl text-sm text-slate-800 dark:text-dark-100 placeholder-slate-400 dark:placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 flex-1">
              <CalendarIcon className="h-4 w-4 text-slate-400" />
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="flex-1 px-3 py-2 bg-slate-50 dark:bg-dark-950 border border-slate-200 dark:border-dark-800 rounded-lg text-sm text-slate-700 dark:text-dark-200 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
              />
            </div>
            <div className="flex items-center gap-2 flex-1">
              <Clock className="h-4 w-4 text-slate-400" />
              <input
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="flex-1 px-3 py-2 bg-slate-50 dark:bg-dark-950 border border-slate-200 dark:border-dark-800 rounded-lg text-sm text-slate-700 dark:text-dark-200 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 justify-end">
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setNewTitle('');
                setNewTime('');
              }}
              className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-700 dark:text-dark-400 dark:hover:text-dark-200 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleAdd}
              disabled={!newTitle.trim() || createEvent.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-violet-500 hover:bg-violet-600 disabled:bg-slate-300 dark:disabled:bg-dark-800 text-white disabled:text-slate-500 rounded-xl text-sm font-semibold transition-all cursor-pointer disabled:cursor-not-allowed"
            >
              {createEvent.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Adicionar
            </button>
          </div>
        </div>
      )}

      {/* Today's Events */}
      {todayEvents.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-xs font-bold text-slate-400 dark:text-dark-400 uppercase tracking-wide px-1">
            Hoje
          </h3>
          <div className="flex flex-col gap-1.5">
            {todayEvents.map((event) => (
              <EventItem
                key={event.id}
                event={event}
                onToggleStatus={() => handleToggleStatus(event.id, event.status)}
                onDelete={() => setDeleteConfirmId(event.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Events */}
      {upcomingEvents.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-xs font-bold text-slate-400 dark:text-dark-400 uppercase tracking-wide px-1">
            Próximos Eventos
          </h3>
          <div className="flex flex-col gap-1.5">
            {upcomingEvents.map((event) => (
              <EventItem
                key={event.id}
                event={event}
                onToggleStatus={() => handleToggleStatus(event.id, event.status)}
                onDelete={() => setDeleteConfirmId(event.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Past pending events */}
      {events.filter((e) => e.date < today && e.status === 'pending').length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-xs font-bold text-slate-400 dark:text-dark-400 uppercase tracking-wide px-1">
            Eventos Passados
          </h3>
          <div className="flex flex-col gap-1.5">
            {events
              .filter((e) => e.date < today && e.status === 'pending')
              .map((event) => (
                <EventItem
                  key={event.id}
                  event={event}
                  onToggleStatus={() => handleToggleStatus(event.id, event.status)}
                  onDelete={() => setDeleteConfirmId(event.id)}
                />
              ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {events.length === 0 && (
        <EmptyState
          icon={<ListChecks className="h-8 w-8" />}
          title="Nenhum evento na agenda"
          description="Adicione eventos para organizar seus compromissos de estudo."
        />
      )}

      <ConfirmDialog
        isOpen={deleteConfirmId !== null}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={() => deleteConfirmId && handleDelete(deleteConfirmId)}
        title="Excluir evento"
        message="Tem certeza que deseja excluir este evento?"
        confirmLabel="Excluir"
        variant="danger"
      />
    </div>
  );
};

interface EventItemProps {
  event: { id: string; title: string; date: string; time?: string | null; status: string; description?: string | null };
  onToggleStatus: () => void;
  onDelete: () => void;
}

const EventItem: React.FC<EventItemProps> = ({ event, onToggleStatus, onDelete }) => {
  const StatusIcon = STATUS_ICONS[event.status] || Circle;
  const statusColor = STATUS_COLORS[event.status] || 'text-slate-400';

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('pt-BR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };

  return (
    <div
      className={`group flex items-center gap-3 px-4 py-3 bg-white dark:bg-dark-900 rounded-2xl border transition-all duration-200 ${
        event.status === 'completed'
          ? 'border-slate-100 dark:border-dark-800/60 opacity-60'
          : event.status === 'cancelled'
          ? 'border-slate-100 dark:border-dark-800/60 opacity-40'
          : 'border-slate-100 dark:border-dark-800 hover:shadow-sm hover:border-slate-200 dark:hover:border-dark-700'
      }`}
    >
      <button
        type="button"
        onClick={onToggleStatus}
        className="flex-shrink-0 cursor-pointer transition-colors"
        title={event.status === 'completed' ? 'Reabrir' : 'Concluir'}
      >
        {StatusIcon ? <StatusIcon className={`h-5 w-5 ${statusColor}`} /> : null}
      </button>

      <div className="flex-grow min-w-0">
        <span
          className={`text-sm font-medium block ${
            event.status === 'completed'
              ? 'text-slate-400 dark:text-dark-400 line-through'
              : 'text-slate-800 dark:text-dark-100'
          }`}
        >
          {event.title}
        </span>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-slate-400 dark:text-dark-400">
            {formatDate(event.date)}
          </span>
          {event.time && (
            <>
              <span className="text-xs text-slate-300 dark:text-dark-500">•</span>
              <span className="text-xs text-slate-400 dark:text-dark-400">{event.time}h</span>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <button
          type="button"
          onClick={onDelete}
          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors cursor-pointer"
          title="Excluir"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};
