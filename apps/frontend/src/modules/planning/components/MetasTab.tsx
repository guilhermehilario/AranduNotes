import React, { useState, useCallback } from 'react';
import {
  Plus,
  Trash2,
  Loader2,
  Target,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { useGoals, useCreateGoal, useUpdateGoal, useDeleteGoal } from '../hooks/useGoals.ts';
import { EmptyState } from '../../../components/ui/EmptyState.tsx';
import { LoadingScreen } from '../../../components/ui/LoadingScreen.tsx';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog.tsx';
import { ProgressBar } from '../../../components/ui/ProgressBar.tsx';
import { useToastStore } from '../../../store/toastStore.ts';
import { extractApiError } from '../../../utils/api-errors.ts';

export const MetasTab: React.FC = () => {
  const { data: goals = [], isLoading } = useGoals();
  const createGoal = useCreateGoal();
  const updateGoal = useUpdateGoal();
  const deleteGoal = useDeleteGoal();

  const [newTitle, setNewTitle] = useState('');
  const [newTargetDate, setNewTargetDate] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleAdd = useCallback(async () => {
    const title = newTitle.trim();
    if (!title) return;
    try {
      await createGoal.mutateAsync({
        title,
        description: newDescription || undefined,
        targetDate: newTargetDate || undefined,
      });
      setNewTitle('');
      setNewTargetDate('');
      setNewDescription('');
      setShowForm(false);
    } catch (err) {
      useToastStore.getState().addToast(extractApiError(err, 'Erro ao criar meta.'), 'error');
    }
  }, [newTitle, newTargetDate, newDescription, createGoal]);

  const handleProgressChange = useCallback(
    (id: string, progress: number) => {
      updateGoal.mutate({ id, input: { progress } });
    },
    [updateGoal],
  );

  const handleDelete = useCallback(
    (id: string) => {
      deleteGoal.mutate(id);
      setDeleteConfirmId(null);
    },
    [deleteGoal],
  );

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return d.toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (isLoading) return <LoadingScreen />;

  const inProgressGoals = goals.filter((g) => g.progress < 100);
  const completedGoals = goals.filter((g) => g.progress >= 100);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500 dark:text-dark-350">
          Defina metas de estudo e acompanhe seu progresso
        </p>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-violet-500 hover:bg-violet-600 text-white rounded-xl text-sm font-semibold transition-all cursor-pointer shadow-md shadow-violet-500/10"
        >
          <Plus className="h-4 w-4" />
          Nova Meta
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="flex flex-col gap-3 p-4 bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-800 rounded-2xl">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Título da meta..."
            className="w-full px-4 py-3 bg-slate-50 dark:bg-dark-950 border border-slate-200 dark:border-dark-800 rounded-xl text-sm text-slate-800 dark:text-dark-100 placeholder-slate-400 dark:placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
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
              value={newTargetDate}
              onChange={(e) => setNewTargetDate(e.target.value)}
              className="flex-1 px-3 py-2 bg-slate-50 dark:bg-dark-950 border border-slate-200 dark:border-dark-800 rounded-lg text-sm text-slate-700 dark:text-dark-200 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
            />
          </div>
          <div className="flex items-center gap-2 justify-end">
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setNewTitle('');
                setNewTargetDate('');
                setNewDescription('');
              }}
              className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-700 dark:text-dark-400 dark:hover:text-dark-200 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleAdd}
              disabled={!newTitle.trim() || createGoal.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-violet-500 hover:bg-violet-600 disabled:bg-slate-300 dark:disabled:bg-dark-800 text-white disabled:text-slate-500 rounded-xl text-sm font-semibold transition-all cursor-pointer disabled:cursor-not-allowed"
            >
              {createGoal.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Criar Meta
            </button>
          </div>
        </div>
      )}

      {/* In Progress Goals */}
      {inProgressGoals.length === 0 && completedGoals.length === 0 && (
        <EmptyState
          icon={<Target className="h-8 w-8" />}
          title="Nenhuma meta definida"
          description="Crie metas para acompanhar seu progresso nos estudos."
        />
      )}

      {inProgressGoals.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {inProgressGoals.map((goal) => (
            <div
              key={goal.id}
              className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-800 rounded-2xl p-5 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex-grow min-w-0">
                  <h4 className="text-sm font-bold text-slate-800 dark:text-dark-100">
                    {goal.title}
                  </h4>
                  {goal.description && (
                    <p className="text-xs text-slate-500 dark:text-dark-350 mt-1">
                      {goal.description}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setDeleteConfirmId(goal.id)}
                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors cursor-pointer flex-shrink-0"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="mb-2">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-slate-500 dark:text-dark-400">
                    Progresso
                  </span>
                  <span className="text-xs font-bold text-violet-500">
                    {goal.progress}%
                  </span>
                </div>
                <ProgressBar value={goal.progress} max={100} />
              </div>

              {goal.targetDate && (
                <p className="text-xs text-slate-400 dark:text-dark-400 flex items-center gap-1">
                  <CalendarIcon className="h-3 w-3" />
                  Meta até {formatDate(goal.targetDate)}
                </p>
              )}

              {/* Quick progress buttons */}
              <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-slate-100 dark:border-dark-800">
                {[25, 50, 75, 100].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => handleProgressChange(goal.id, pct)}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                      goal.progress >= pct
                        ? 'bg-violet-100 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400'
                        : 'bg-slate-50 dark:bg-dark-950 text-slate-500 dark:text-dark-400 hover:bg-violet-50 dark:hover:bg-violet-950/20'
                    }`}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Completed Goals */}
      {completedGoals.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-xs font-bold text-slate-400 dark:text-dark-400 uppercase tracking-wide px-1">
            Concluídas ({completedGoals.length})
          </h3>
          <div className="flex flex-col gap-1.5">
            {completedGoals.map((goal) => (
              <div
                key={goal.id}
                className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-dark-900 rounded-2xl border border-slate-100 dark:border-dark-800/60 opacity-60"
              >
                <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/30 flex items-center justify-center flex-shrink-0">
                  <Target className="h-4 w-4 text-emerald-500" />
                </div>
                <div className="flex-grow min-w-0">
                  <span className="text-sm font-medium text-slate-400 dark:text-dark-400 block">
                    {goal.title}
                  </span>
                  {goal.targetDate && (
                    <span className="text-xs text-slate-400 dark:text-dark-400">
                      Concluída • {formatDate(goal.targetDate)}
                    </span>
                  )}
                </div>
                <span className="text-xs font-bold text-emerald-500">100%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={deleteConfirmId !== null}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={() => deleteConfirmId && handleDelete(deleteConfirmId)}
        title="Excluir meta"
        message="Tem certeza que deseja excluir esta meta?"
        confirmLabel="Excluir"
        variant="danger"
      />
    </div>
  );
};
