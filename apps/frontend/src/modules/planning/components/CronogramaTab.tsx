import React, { useState, useCallback } from 'react';
import {
  Plus,
  Trash2,
  Loader2,
  CheckCircle2,
  Calendar as CalendarIcon,
  Timeline,
} from 'lucide-react';
import { useEvents, useCreateEvent, useUpdateEvent, useDeleteEvent } from '../hooks/useEvents.ts';
import { EmptyState } from '../../../components/ui/EmptyState.tsx';
import { LoadingScreen } from '../../../components/ui/LoadingScreen.tsx';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog.tsx';
import { useToastStore } from '../../../store/toastStore.ts';
import { extractApiError } from '../../../utils/api-errors.ts';
import { formatDate } from '../../../utils/dateFormatUtils.ts';

export const CronogramaTab: React.FC = () => {
  const { data: events = [], isLoading } = useEvents('cronograma');
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();

  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleAdd = useCallback(async () => {
    const title = newTitle.trim();
    if (!title || !newDate) return;
    try {
      await createEvent.mutateAsync({
        title,
        date: newDate,
        description: newDescription || undefined,
        type: 'cronograma',
      });
      setNewTitle('');
      setNewDate('');
      setNewDescription('');
      setShowForm(false);
    } catch (err) {
      useToastStore.getState().addToast(extractApiError(err, 'Erro ao criar item.'), 'error');
    }
  }, [newTitle, newDate, newDescription, createEvent]);

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

  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  const pendingEvents = sortedEvents.filter((e) => e.status !== 'completed');
  const completedEvents = sortedEvents.filter((e) => e.status === 'completed');

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <p className="text-xs sm:text-sm text-slate-500 dark:text-dark-350">
          Acompanhe o cronograma de estudos e marcos importantes
        </p>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-violet-500 hover:bg-violet-600 text-white rounded-xl text-sm font-semibold transition-all cursor-pointer shadow-md shadow-violet-500/10 self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          Novo Marco
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="flex flex-col gap-3 p-4 rounded-2xl" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Título do marco..."
            className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none transition-all"
            style={{
              background: 'var(--bg-surface-hover)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
            }}
            autoFocus
            onFocus={(e) => { e.currentTarget.style.borderColor = '#A78BFA'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; }}
          />
          <input
            type="text"
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            placeholder="Descrição (opcional)..."
            className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none transition-all"
            style={{
              background: 'var(--bg-surface-hover)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = '#A78BFA'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; }}
          />
          <div className="flex items-center gap-2">
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
          <div className="flex items-center gap-2 justify-end">
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setNewTitle('');
                setNewDate('');
                setNewDescription('');
              }}
              className="px-4 py-2 text-sm font-semibold transition-colors cursor-pointer"
              style={{ color: 'var(--text-secondary)' }}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleAdd}
              disabled={!newTitle.trim() || !newDate || createEvent.isPending}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer disabled:cursor-not-allowed"
              style={{
                background: (!newTitle.trim() || !newDate || createEvent.isPending) ? 'var(--bg-surface-hover)' : '#8B5CF6',
                color: (!newTitle.trim() || !newDate || createEvent.isPending) ? 'var(--text-secondary)' : '#FFFFFF',
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

      {/* Timeline */}
      {sortedEvents.length === 0 && !showForm && (
        <EmptyState
          icon={<Timeline className="h-8 w-8" />}
          title="Nenhum marco no cronograma"
          description="Adicione marcos importantes para acompanhar seu progresso nos estudos."
        />
      )}

      {pendingEvents.length > 0 && (
        <div className="relative">
          <div className="absolute left-[19px] top-0 bottom-0 w-0.5 bg-violet-200 dark:bg-violet-900/40" />

          <div className="flex flex-col gap-4">
            {pendingEvents.map((event) => {
              return (
                <div key={event.id} className="relative flex gap-4">
                  {/* Timeline dot */}
                  <div className="flex-shrink-0 relative z-10">
                    <div className="w-10 h-10 rounded-full bg-violet-100 dark:bg-violet-950/30 border-4 border-white dark:border-dark-900 flex items-center justify-center">
                      <CalendarIcon className="h-4 w-4 text-violet-500" />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-grow pb-2">
                    <div className="rounded-2xl p-4 transition-shadow hover:shadow-md"
                      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-grow min-w-0">
                          <h4 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                            {event.title}
                          </h4>
                          {event.description && (
                            <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                              {event.description}
                            </p>
                          )}
                          <p className="text-xs text-violet-500 font-semibold mt-2">
                            {formatDate(event.date)}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(event.id, event.status)}
                            className="p-1.5 rounded-lg transition-colors cursor-pointer hover:text-emerald-500 hover:bg-[var(--bg-surface-hover)]"
                            style={{ color: 'var(--text-secondary)' }}
                            title="Concluir"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(event.id)}
                            className="p-1.5 rounded-lg transition-colors cursor-pointer hover:text-red-500 hover:bg-[var(--bg-surface-hover)]"
                            style={{ color: 'var(--text-secondary)' }}
                            title="Excluir"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Completed */}
      {completedEvents.length > 0 && (
        <div className="flex flex-col gap-2 mt-2">
          <h3 className="text-xs font-bold text-slate-400 dark:text-dark-400 uppercase tracking-wide px-1">
            Concluídos ({completedEvents.length})
          </h3>
          <div className="flex flex-col gap-1.5">
            {completedEvents.map((event) => (                <div
                  key={event.id}
                  className="flex items-center gap-3 px-4 py-3 rounded-2xl"
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-color)',
                    opacity: 0.6,
                  }}
                >
                <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                <div className="flex-grow min-w-0">
                  <span className="text-sm font-medium text-slate-400 dark:text-dark-400 line-through block">
                    {event.title}
                  </span>
                  <span className="text-xs text-slate-400 dark:text-dark-400">
                    {formatDate(event.date)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={deleteConfirmId !== null}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={() => deleteConfirmId && handleDelete(deleteConfirmId)}
        title="Excluir marco"
        message="Tem certeza que deseja excluir este marco do cronograma?"
        confirmLabel="Excluir"
        variant="danger"
      />
    </div>
  );
};
