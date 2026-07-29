import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Timer, Trash2, ChevronLeft, ChevronRight, XCircle } from 'lucide-react';
import type { PomodoroSession } from '../types.ts';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog.tsx';
import { useDeletePomodoro } from '../hooks/usePomodoro.ts';

const ITEMS_PER_PAGE = 5;

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}min ${s}s` : `${m}min`;
}

interface PomodoroHistoryProps {
  sessions: PomodoroSession[];
}

export const PomodoroHistory: React.FC<PomodoroHistoryProps> = ({ sessions }) => {
  const deletePomodoro = useDeletePomodoro();

  const [historyTab, setHistoryTab] = useState<'completed' | 'cancelled'>('completed');
  const [cancelledPage, setCancelledPage] = useState(0);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const completedSessions = sessions.filter((s) => s.completed);
  const totalFocusMinutes = completedSessions.reduce((acc, s) => acc + s.duration, 0);

  const cancelledSessions = useMemo(() => {
    return sessions
      .filter((s) => !s.completed)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [sessions]);

  const totalCancelledPages = Math.max(1, Math.ceil(cancelledSessions.length / ITEMS_PER_PAGE));
  const paginatedCancelled = cancelledSessions.slice(
    cancelledPage * ITEMS_PER_PAGE,
    (cancelledPage + 1) * ITEMS_PER_PAGE,
  );

  const handleDeleteSession = useCallback(
    (id: string) => {
      deletePomodoro.mutate(id);
      setDeleteConfirmId(null);
    },
    [deletePomodoro],
  );

  // Reset page when switching to cancelled tab
  useEffect(() => {
    if (historyTab === 'cancelled') {
      setCancelledPage(0);
    }
  }, [historyTab]);

  return (
    <div className="rounded-2xl p-5" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
      {/* Tabs: Completed / Cancelled */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1 p-0.5 rounded-lg" style={{ background: 'var(--bg-surface-hover)' }}>
          <button
            type="button"
            onClick={() => setHistoryTab('completed')}
            className="px-3 py-1.5 text-[11px] font-bold rounded-md transition-all cursor-pointer"
            style={{
              background: historyTab === 'completed' ? 'var(--bg-surface)' : 'transparent',
              color: historyTab === 'completed' ? '#7C3AED' : 'var(--text-secondary)',
              boxShadow: historyTab === 'completed' ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            Concluídas
          </button>
          <button
            type="button"
            onClick={() => setHistoryTab('cancelled')}
            className="px-3 py-1.5 text-[11px] font-bold rounded-md transition-all cursor-pointer"
            style={{
              background: historyTab === 'cancelled' ? 'var(--bg-surface)' : 'transparent',
              color: historyTab === 'cancelled' ? '#EF4444' : 'var(--text-secondary)',
              boxShadow: historyTab === 'cancelled' ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            Canceladas
          </button>
        </div>
        <div className="text-right">
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Total de foco</p>
          <p className="text-lg font-heading font-extrabold text-violet-500">{totalFocusMinutes}min</p>
        </div>
      </div>

      {/* Completed Sessions */}
      {historyTab === 'completed' && (
        <>
          {completedSessions.length === 0 && (
            <p className="text-sm text-center py-8" style={{ color: 'var(--text-secondary)' }}>
              Nenhuma sessão concluída ainda.
            </p>
          )}
          <div className="flex flex-col gap-1.5 max-h-[400px] overflow-y-auto">
            {completedSessions.slice(0, 20).map((session) => (
              <div
                key={session.id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                style={{ border: '1px solid var(--border-color)' }}
              >
                <Timer className="h-4 w-4 text-violet-500 flex-shrink-0" />
                <div className="flex-grow min-w-0">
                  <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                    {session.taskName || 'Sessão de foco'}
                  </p>
                  <p className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                    {session.duration}min • {session.createdAt ? new Date(session.createdAt).toLocaleDateString('pt-BR') : ''}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setDeleteConfirmId(session.id)}
                  className="p-1 rounded-lg transition-colors cursor-pointer"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Cancelled Sessions */}
      {historyTab === 'cancelled' && (
        <>
          {cancelledSessions.length === 0 && (
            <p className="text-sm text-center py-8" style={{ color: 'var(--text-secondary)' }}>
              Nenhuma sessão cancelada.
            </p>
          )}
          <div className="flex flex-col gap-1.5 min-h-[200px]">
            {paginatedCancelled.map((session) => (
              <div
                key={session.id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                style={{ border: '1px solid var(--border-color)' }}
              >
                <XCircle className="h-4 w-4 text-rose-400 flex-shrink-0" />
                <div className="flex-grow min-w-0">
                  <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                    {session.taskName || 'Sessão de foco'}
                  </p>
                  <p className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                    {formatElapsed(session.duration)} focados • {session.createdAt ? new Date(session.createdAt).toLocaleDateString('pt-BR') : ''}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setDeleteConfirmId(session.id)}
                  className="p-1 rounded-lg transition-colors cursor-pointer"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {cancelledSessions.length > ITEMS_PER_PAGE && (
            <div className="flex items-center justify-center gap-3 mt-3 pt-3" style={{ borderTop: '1px solid var(--border-color)' }}>
              <button
                type="button"
                onClick={() => setCancelledPage((p) => Math.max(0, p - 1))}
                disabled={cancelledPage === 0}
                className="p-1.5 rounded-lg transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ color: 'var(--text-secondary)' }}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-[11px] font-semibold" style={{ color: 'var(--text-secondary)' }}>
                {cancelledPage + 1} de {totalCancelledPages}
              </span>
              <button
                type="button"
                onClick={() => setCancelledPage((p) => Math.min(totalCancelledPages - 1, p + 1))}
                disabled={cancelledPage >= totalCancelledPages - 1}
                className="p-1.5 rounded-lg transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ color: 'var(--text-secondary)' }}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        isOpen={deleteConfirmId !== null}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={() => deleteConfirmId && handleDeleteSession(deleteConfirmId)}
        title="Excluir sessão"
        message="Tem certeza que deseja excluir esta sessão?"
        confirmLabel="Excluir"
        variant="danger"
      />
    </div>
  );
};
