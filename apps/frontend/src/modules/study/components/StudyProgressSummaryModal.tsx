import React, { useCallback, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Modal } from '../../../components/ui/Modal.tsx';
import { StudyProgressSummary } from './StudyProgressSummary.tsx';
import { StudyHistory } from './StudyHistory.tsx';

interface StudyProgressSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabView = 'resumo' | 'historico';

export const StudyProgressSummaryModal: React.FC<StudyProgressSummaryModalProps> = ({
  isOpen,
  onClose,
}) => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabView>('resumo');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['study-stats'] }),
      queryClient.invalidateQueries({ queryKey: ['study-history'] }),
    ]).finally(() => {
      setIsRefreshing(false);
    });
  }, [queryClient]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Progresso dos Estudos"
      size="2xl"
    >
      {/* Header: Tabs + Refresh */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        {/* View Tabs */}
        <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-100 dark:bg-dark-900">
          <button
            type="button"
            onClick={() => setActiveTab('resumo')}
            className={`px-3 py-1.5 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
              activeTab === 'resumo'
                ? 'bg-white dark:bg-dark-800 text-slate-800 dark:text-dark-50 shadow-sm'
                : 'text-slate-500 dark:text-dark-400 hover:text-slate-700 dark:hover:text-dark-200'
            }`}
          >
            Resumo
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('historico')}
            className={`px-3 py-1.5 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
              activeTab === 'historico'
                ? 'bg-white dark:bg-dark-800 text-slate-800 dark:text-dark-50 shadow-sm'
                : 'text-slate-500 dark:text-dark-400 hover:text-slate-700 dark:hover:text-dark-200'
            }`}
          >
            Histórico
          </button>
        </div>

        {/* Refresh Button */}
        <button
          type="button"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-brand-500 dark:text-dark-400 dark:hover:text-brand-400 transition-colors py-1.5 px-3 rounded-lg hover:bg-slate-100 dark:hover:bg-dark-800 cursor-pointer disabled:opacity-50"
          title="Atualizar dados"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 transition-transform duration-300 ${isRefreshing ? 'animate-spin text-brand-500' : ''}`}
          />
          Atualizar
        </button>
      </div>

      {/* Content */}
      {activeTab === 'resumo' ? <StudyProgressSummary /> : <StudyHistory />}
    </Modal>
  );
};

export default StudyProgressSummaryModal;
