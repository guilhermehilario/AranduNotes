import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Share2,
  BookOpen,
  FileText,
  HelpCircle,
  Layers,
  Timer,
  RefreshCw,
} from 'lucide-react';
import { useInbox } from '../hooks/useSharing';
import { PageContainer } from '../../../components/ui/PageContainer.tsx';
import { Card } from '../../../components/ui/Card.tsx';
import { EmptyState } from '../../../components/ui/EmptyState.tsx';
import { formatDate } from '../../../utils/dateFormatUtils.ts';
import { RESOURCE_TYPE_LABELS } from '../types';
import type { InboxItem } from '../types';

const TYPE_ICONS: Record<InboxItem['resourceType'], React.ReactNode> = {
  notebook: <BookOpen className="h-5 w-5 text-brand-500" />,
  leaf: <FileText className="h-5 w-5 text-emerald-500" />,
  question: <HelpCircle className="h-5 w-5 text-violet-500" />,
  flashcard: <Layers className="h-5 w-5 text-sky-500" />,
  mockExam: <Timer className="h-5 w-5 text-amber-500" />,
};

function resolvePath(item: InboxItem): string {
  switch (item.resourceType) {
    case 'notebook':
      return item.notebookId ? `/notebooks/${item.notebookId}` : '/dashboard';
    case 'leaf':
      return item.notebookId && item.leafId
        ? `/notebooks/${item.notebookId}/leaves/${item.leafId}`
        : '/dashboard';
    case 'flashcard':
      return item.notebookId ? `/notebooks/${item.notebookId}/study` : '/studies/flashcards';
    case 'question':
      return '/studies/questions';
    case 'mockExam':
      return '/studies/mock-exams';
    default:
      return '/dashboard';
  }
}

export const SharedWithMeView: React.FC = () => {
  const navigate = useNavigate();
  const { data: items = [], isLoading } = useInbox();

  if (isLoading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <RefreshCw className="h-10 w-10 animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <PageContainer>
      <div className="flex items-center gap-2 mb-1">
        <Share2 className="h-5 w-5 text-brand-500" />
        <h1 className="text-2xl font-heading font-extrabold" style={{ color: 'var(--text-primary)' }}>
          Compartilhados comigo
        </h1>
      </div>
      <p className="text-sm text-slate-500 dark:text-dark-400 mb-6">
        Conteúdo que outras pessoas compartilharam com você para visualizar e editar.
      </p>

      {items.length === 0 ? (
        <EmptyState
          icon={<Share2 className="h-8 w-8" />}
          title="Nada compartilhado ainda"
          description="Quando alguém compartilhar um recurso com você, ele aparecerá aqui."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <Card
              key={item.id}
              hoverable
              onClick={() => navigate(resolvePath(item))}
              className="p-4 cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'var(--bg-surface-hover)' }}
                >
                  {TYPE_ICONS[item.resourceType]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-dark-800 text-slate-600 dark:text-dark-300 uppercase">
                      {RESOURCE_TYPE_LABELS[item.resourceType]}
                    </span>
                    <span className="text-xs text-slate-400 dark:text-dark-500">
                      {formatDate(item.createdAt)}
                    </span>
                  </div>
                  <h3 className="text-sm font-heading font-bold text-slate-800 dark:text-dark-50 truncate mt-1">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-400 dark:text-dark-500 truncate">
                    Compartilhado por {item.owner.name} ({item.owner.email})
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </PageContainer>
  );
};

export default SharedWithMeView;