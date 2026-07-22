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

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'long',
    });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500 dark:text-dark-350">
          Acompanhe o cronograma de estudos e marcos importantes
        </p>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-violet-500 hover:bg-violet-600 text-white rounded-xl text-sm font-semibold transition-all cursor-pointer shadow-md shadow-violet-500/10"
        >
          <Plus className="h-4 w-4" />
          Novo Marco
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="flex flex-col gap-3 p-4 bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-800 rounded-2xl">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Título do marco..."
            className="w-full px-4 py-3 bg-slate-50 dark:bg-dark-950 border border-slate-200 dark:border-dark-800 rounded-xl text-sm text-slate-800 dark:text-dark-100 placeholder-slate-400 dark:placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all"
            autoFocus
          />
          <input
            type="text"
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            placeholder="Descrição (opcional)..."
            className="w-full px-4 py-3 bg-slate-50 dark:bg-dark-950 border border-slate-200 dark:border-dark-800 rounded-xl text-sm text-slate-800 dark:text-dark-100 placeholder-slate-400 dark:placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all"
          />
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-slate-400" />
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="flex-1 px-3 py-2 bg-slate-50 dark:bg-dark-950 border border-slate-200 dark:border-dark-800 rounded-lg text-sm text-slate-700 dark:text-dark-200 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
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
              className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-700 dark:text-dark-400 dark:hover:text-dark-200 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleAdd}
              disabled={!newTitle.trim() || !newDate || createEvent.isPending}
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
                    <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-800 rounded-2xl p-4 hover:shadow-sm transition-shadow">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-grow min-w-0">
                          <h4 className="text-sm font-bold text-slate-800 dark:text-dark-100">
                            {event.title}
                          </h4>
                          {event.description && (
                            <p className="text-xs text-slate-500 dark:text-dark-350 mt-1">
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
                            className="p-1.5 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 rounded-lg transition-colors cursor-pointer"
                            title="Concluir"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(event.id)}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors cursor-pointer"
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
            {completedEvents.map((event) => (
              <div
                key={event.id}
                className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-dark-900 rounded-2xl border border-slate-100 dark:border-dark-800/60 opacity-60"
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
