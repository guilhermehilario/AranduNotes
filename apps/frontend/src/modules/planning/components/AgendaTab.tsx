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

  // Usa comparação com Date objects em vez de string para evitar
  // problemas com timezone (a API retorna ISO strings com hora UTC)
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  const todayEvents = events.filter((e) => {
    const d = new Date(e.date);
    return d >= todayStart && d <= todayEnd;
  });

  const upcomingEvents = events.filter((e) => new Date(e.date) > todayEnd);

  const pastPendingEvents = events.filter(
    (e) => new Date(e.date) < todayStart && e.status === 'pending',
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Quick Add Button */}
      {!showForm && (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="flex items-center gap-3 px-4 py-3 rounded-2xl transition-all cursor-pointer"
          style={{
            background: 'var(--bg-surface)',
            border: '1px dashed var(--border-color)',
            color: 'var(--text-secondary)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#A78BFA';
            e.currentTarget.style.borderColor = '#A78BFA';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-color)';
            e.currentTarget.style.color = 'var(--text-secondary)';
          }}
        >
          <Plus className="h-5 w-5" />
          <span className="text-sm font-semibold">Adicionar evento na agenda</span>
        </button>
      )}

      {/* Add Form */}
      {showForm && (
        <div className="flex flex-col gap-3 p-4 rounded-2xl" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Título do evento..."
            className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none transition-all"
            style={{
              background: 'var(--bg-surface-hover)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = '#A78BFA'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; }}
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 flex-1">
              <CalendarIcon className="h-4 w-4" style={{ color: 'var(--text-secondary)' }} />
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg text-sm focus:outline-none"
                style={{
                  background: 'var(--bg-surface-hover)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
            <div className="flex items-center gap-2 flex-1">
              <Clock className="h-4 w-4" style={{ color: 'var(--text-secondary)' }} />
              <input
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg text-sm focus:outline-none"
                style={{
                  background: 'var(--bg-surface-hover)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                }}
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
              className="px-4 py-2 text-sm font-semibold transition-colors cursor-pointer"
              style={{ color: 'var(--text-secondary)' }}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleAdd}
              disabled={!newTitle.trim() || createEvent.isPending}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer disabled:cursor-not-allowed"
              style={{
                background: createEvent.isPending || !newTitle.trim() ? 'var(--bg-surface-hover)' : '#8B5CF6',
                color: createEvent.isPending || !newTitle.trim() ? 'var(--text-secondary)' : '#FFFFFF',
              }}
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
          <h3 className="text-xs font-bold uppercase tracking-wide px-1" style={{ color: 'var(--text-secondary)' }}>
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
          <h3 className="text-xs font-bold uppercase tracking-wide px-1" style={{ color: 'var(--text-secondary)' }}>
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
      {pastPendingEvents.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-xs font-bold uppercase tracking-wide px-1" style={{ color: 'var(--text-secondary)' }}>
            Eventos Passados
          </h3>
          <div className="flex flex-col gap-1.5">
            {pastPendingEvents.map((event) => (
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
      className="group flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200"
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-color)',
        opacity: event.status === 'completed' ? 0.6 : event.status === 'cancelled' ? 0.4 : 1,
      }}
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
          className="text-sm font-medium block"
          style={{
            color: event.status === 'completed' ? 'var(--text-secondary)' : 'var(--text-primary)',
            textDecoration: event.status === 'completed' ? 'line-through' : 'none',
          }}
        >
          {event.title}
        </span>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            {formatDate(event.date)}
          </span>
          {event.time && (
            <>
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>•</span>
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{event.time}h</span>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <button
          type="button"
          onClick={onDelete}
          className="p-1.5 rounded-lg transition-colors cursor-pointer"
          style={{ color: 'var(--text-secondary)' }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#EF4444'; e.currentTarget.style.background = 'var(--bg-surface-hover)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'transparent'; }}
          title="Excluir"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};
