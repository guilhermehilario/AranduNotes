import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, CheckCircle } from 'lucide-react';
import { Button } from '../../../components/ui/Button.tsx';

interface StudyResultProps {
  nbId: string;
  reviewedCount: number;
  flashcardsLength: number;
  onReset: () => void;
}

export const StudyResult: React.FC<StudyResultProps> = ({
  nbId,
  reviewedCount,
  flashcardsLength,
  onReset,
}) => {
  const navigate = useNavigate();

  if (flashcardsLength === 0) {
    return (
      <div className="max-w-4xl mx-auto flex flex-col items-center justify-center text-center p-8 gap-5 mt-10">
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center text-emerald-500 shadow-md">
          <CheckCircle className="h-8 w-8" />
        </div>
        <div>
          <h2 className="text-2xl font-heading font-extrabold text-slate-800 dark:text-dark-50">
            Tudo revisado!
          </h2>
          <p className="text-slate-500 dark:text-dark-350 text-sm mt-2">
            Não existem flashcards agendados para revisão hoje neste caderno.
            Excelente trabalho!
          </p>
        </div>
        <div className="flex gap-3 mt-2 w-full">
          <Button
            variant="outline"
            onClick={() => navigate(`/notebooks/${nbId}`)}
            className="flex-1"
          >
            Voltar ao Caderno
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto flex flex-col items-center justify-center text-center p-8 gap-5 mt-10">
      <div className="w-16 h-16 rounded-2xl bg-brand-50 dark:bg-brand-950/20 flex items-center justify-center text-brand-500 shadow-md">
        <Brain className="h-8 w-8" />
      </div>
      <div>
        <h2 className="text-2xl font-heading font-extrabold text-slate-850 dark:text-dark-50">
          Sessão Concluída!
        </h2>
        <p className="text-slate-500 dark:text-dark-350 text-sm mt-2">
          Parabéns! Você revisou{' '}
          <span className="font-bold text-slate-800 dark:text-dark-100">
            {reviewedCount}
          </span>{' '}
          flashcards. Mantenha a consistência de estudos diária!
        </p>
      </div>
      <div className="flex flex-col gap-3 mt-4 w-full">
        <Button
          onClick={() => navigate(`/notebooks/${nbId}`)}
          className="w-full"
        >
          Voltar ao Caderno
        </Button>
        <Button
          variant="outline"
          onClick={onReset}
          className="w-full"
        >
          Estudar Novamente
        </Button>
      </div>
    </div>
  );
};

export default StudyResult;
