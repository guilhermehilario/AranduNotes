import React, { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ArrowLeft, Library, GraduationCap } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import notebookService from '../../notebooks/services/notebookService';
import { PageContainer } from '../../../components/ui/PageContainer.tsx';
import { QuestionsBank } from '../components/QuestionsBank.tsx';
import { QuestionsPractice } from '../components/QuestionsPractice.tsx';

type QuestionsTab = 'banco' | 'praticar';

const TABS: { id: QuestionsTab; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'banco', label: 'Banco de Questões', icon: Library },
  { id: 'praticar', label: 'Praticar', icon: GraduationCap },
];

export const QuestionsStudyView: React.FC = () => {
  const [searchParams] = useSearchParams();
  const notebookId = searchParams.get('notebookId') || undefined;
  const [activeTab, setActiveTab] = useState<QuestionsTab>(
    searchParams.get('tab') === 'praticar' ? 'praticar' : 'banco',
  );

  const { data: notebooks = [] } = useQuery({
    queryKey: ['notebooks'],
    queryFn: notebookService.getNotebooks,
    staleTime: 30_000,
  });

  const notebookItems = notebooks.map((nb) => ({
    id: nb.id,
    title: nb.title,
    color: nb.color,
  }));

  return (
    <PageContainer>
      <Link
        to="/studies"
        className="flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-dark-300 hover:text-brand-500 transition-colors w-fit"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar aos Estudos
      </Link>

      <p className="text-sm text-slate-500 dark:text-dark-400">
        Gerencie suas questões, crie simulados ou pratique agora.
      </p>

      <div className="flex items-center gap-2 bg-slate-100 dark:bg-dark-900 rounded-xl p-1 w-fit">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-white dark:bg-dark-800 text-slate-800 dark:text-dark-50 shadow-sm'
                  : 'text-slate-500 dark:text-dark-400 hover:text-slate-700 dark:hover:text-dark-200'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'banco' ? (
        <QuestionsBank notebooks={notebookItems} initialNotebookId={notebookId} />
      ) : (
        <QuestionsPractice
          notebookId={notebookId}
          onGoToBank={() => setActiveTab('banco')}
        />
      )}
    </PageContainer>
  );
};

export default QuestionsStudyView;