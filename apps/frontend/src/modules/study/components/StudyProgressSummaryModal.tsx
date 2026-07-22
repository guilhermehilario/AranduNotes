import React, { useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal.tsx';
import { StudyProgressSummary } from './StudyProgressSummary.tsx';
import { useStudyStats } from '../hooks/useStudyStats';

interface StudyProgressSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StudyProgressSummaryModal: React.FC<StudyProgressSummaryModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { isFetching, refetch } = useStudyStats();

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Progresso dos Estudos"
      size="2xl"
    >
      {/* Header Actions */}
      <div className="flex items-center justify-end mb-4 -mt-2">
        <button
          type="button"
          onClick={handleRefresh}
          disabled={isFetching}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-brand-500 dark:text-dark-400 dark:hover:text-brand-400 transition-colors py-1.5 px-3 rounded-lg hover:bg-slate-100 dark:hover:bg-dark-800 cursor-pointer disabled:opacity-50"
          title="Atualizar estatísticas"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 transition-transform duration-300 ${isFetching ? 'animate-spin text-brand-500' : ''}`}
          />
          Atualizar
        </button>
      </div>

      <StudyProgressSummary />
    </Modal>
  );
};

export default StudyProgressSummaryModal;
