import React from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  BookOpen,
  FileText,
  HelpCircle,
  Layers,
  Timer,
  Loader2,
  Home,
  ChevronRight,
} from 'lucide-react';
import publicService from '../services/publicService';
import { RESOURCE_TYPE_LABELS } from '../types';
import type {
  ShareResourceType,
  PublicResource,
  PublicLeafNode,
  PublicQuestion,
  PublicMockExam,
} from '../types';

const TYPE_ALIASES: Record<string, ShareResourceType> = {
  notebook: 'notebook',
  notebooks: 'notebook',
  leaf: 'leaf',
  leaves: 'leaf',
  question: 'question',
  questions: 'question',
  flashcard: 'flashcard',
  flashcards: 'flashcard',
  mockExam: 'mockExam',
  'mock-exam': 'mockExam',
  'mock-exams': 'mockExam',
};

function renderLeafTree(
  nodes: PublicLeafNode[],
  token: string,
  depth: number,
  onOpen: (leafId: string) => void,
): React.ReactNode {
  return nodes.map((node) => (
    <React.Fragment key={node.id}>
      <button
        type="button"
        onClick={() => onOpen(node.id)}
        className="w-full text-left px-3 py-2 rounded-xl flex items-center gap-2 text-sm text-slate-700 dark:text-dark-200 hover:bg-slate-100 dark:hover:bg-dark-800 transition-colors cursor-pointer"
        style={{ paddingLeft: `${12 + depth * 20}px` }}
      >
        <FileText className="h-4 w-4 text-slate-400 flex-shrink-0" />
        <span className="truncate font-medium">{node.title}</span>
        <ChevronRight className="h-4 w-4 text-slate-400 flex-shrink-0" />
      </button>
      {node.children.length > 0 &&
        renderLeafTree(node.children, token, depth + 1, onOpen)}
    </React.Fragment>
  ));
}

function QuestionCard({
  question,
  explanation,
}: {
  question: PublicQuestion | PublicMockExam['questions'][number];
  explanation?: string | null;
}) {
  return (
    <div
      className="rounded-2xl p-4 flex flex-col gap-3"
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}
    >
      <p className="text-sm font-medium text-slate-800 dark:text-dark-50 leading-relaxed">
        {question.question}
      </p>
      {question.options.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {question.options.map((option, index) => (
            <div
              key={index}
              className="px-3 py-2 rounded-xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700 text-sm text-slate-600 dark:text-dark-300"
            >
              {option}
            </div>
          ))}
        </div>
      )}
      {explanation && (
        <p className="text-xs text-slate-400 dark:text-dark-500">
          Explicação: {explanation}
        </p>
      )}
    </div>
  );
}

export const PublicContentView: React.FC = () => {
  const { type: rawType, id } = useParams<{ type: string; id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';
  const type = rawType ? TYPE_ALIASES[rawType] : undefined;

  const resourceQuery = useQuery({
    queryKey: ['public', type, id, token],
    queryFn: () =>
      publicService.getResource(type as ShareResourceType, id as string, token),
    enabled: !!type && !!id && token.length >= 16,
  });

  const leavesQuery = useQuery({
    queryKey: ['public', 'notebook', id, token, 'leaves'],
    queryFn: () => publicService.getNotebookLeaves(id as string, token),
    enabled: type === 'notebook' && !!id && token.length >= 16 && !resourceQuery.isError,
  });

  const resource = resourceQuery.data as PublicResource | undefined;

  const openLeaf = (leafId: string) => {
    navigate(`/public/leaf/${leafId}?token=${encodeURIComponent(token)}`);
  };

  let typeIcon = <HelpCircle className="h-5 w-5 text-brand-500" />;
  if (type === 'notebook') typeIcon = <BookOpen className="h-5 w-5 text-brand-500" />;
  if (type === 'leaf') typeIcon = <FileText className="h-5 w-5 text-emerald-500" />;
  if (type === 'flashcard') typeIcon = <Layers className="h-5 w-5 text-sky-500" />;
  if (type === 'mockExam') typeIcon = <Timer className="h-5 w-5 text-amber-500" />;

  return (
    <div
      className="min-h-dvh flex flex-col"
      style={{ background: 'var(--bg-primary)' }}
    >
      {/* Top bar */}
      <header
        className="sticky top-0 z-10 px-4 sm:px-6 py-3 flex items-center justify-between"
        style={{
          background: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border-color)',
        }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-xl bg-brand-500 flex items-center justify-center text-white font-heading font-extrabold text-sm"
          >
            A
          </div>
          <span className="font-heading font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
            Arandu
          </span>
        </div>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold text-slate-500 dark:text-dark-300 hover:text-brand-500 hover:bg-slate-100 dark:hover:bg-dark-800 transition-colors cursor-pointer"
        >
          <Home className="h-4 w-4" />
          Acessar o app
        </button>
      </header>

      <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {resourceQuery.isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-brand-500" />
          </div>
        ) : resourceQuery.isError || !resource || !type ? (
          <div className="text-center py-20 flex flex-col items-center gap-3">
            <HelpCircle className="h-12 w-12 text-slate-300 dark:text-dark-600" />
            <h1 className="text-xl font-heading font-bold" style={{ color: 'var(--text-primary)' }}>
              Link inválido ou expirado
            </h1>
            <p className="text-sm text-slate-500 dark:text-dark-400 max-w-md">
              Este conteúdo não está mais disponível publicamente ou o link está incorreto.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center"
                style={{ background: 'var(--bg-surface-hover)' }}
              >
                {typeIcon}
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-dark-800 text-slate-600 dark:text-dark-300 uppercase">
                  {RESOURCE_TYPE_LABELS[type]}
                </span>
                <h1
                  className="text-xl sm:text-2xl font-heading font-extrabold truncate mt-1"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {('title' in resource ? resource.title : undefined) ||
                    ('question' in resource ? resource.question : undefined) ||
                    ('front' in resource ? resource.front : undefined) ||
                    'Conteúdo compartilhado'}
                </h1>
              </div>
            </div>

            {/* ÷ Tipos de conteúdo */}
            {type === 'notebook' && (
              <div className="flex flex-col gap-3">
                {resourceQuery.data && 'description' in resourceQuery.data && (
                  <p
                    className="text-sm text-slate-500 dark:text-dark-400"
                  >
                    {(resourceQuery.data as { description: string | null }).description ||
                      'Nenhuma descrição adicionada.'}
                  </p>
                )}
                <div className="rounded-2xl p-2" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
                  {leavesQuery.isLoading ? (
                    <div className="flex justify-center py-10">
                      <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
                    </div>
                  ) : (leavesQuery.data || []).length === 0 ? (
                    <p className="text-sm text-slate-400 dark:text-dark-500 py-8 text-center">
                      Este caderno não possui folhas.
                    </p>
                  ) : (
                    <div className="flex flex-col py-1">
                      {renderLeafTree(leavesQuery.data || [], token, 0, openLeaf)}
                    </div>
                  )}
                </div>
              </div>
            )}

            {type === 'leaf' && 'content' in resource && (
              <div
                className="rounded-2xl p-6 prose prose-slate dark:prose-invert max-w-none"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}
                dangerouslySetInnerHTML={{ __html: resource.content }}
              />
            )}

            {type === 'flashcard' && (
              <>
                <div
                  className="rounded-2xl p-6 flex flex-col gap-2"
                  style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}
                >
                  <span className="text-[11px] font-bold text-slate-400 uppercase">Frente</span>
                  <p className="text-base font-semibold text-slate-800 dark:text-dark-50">
                    {('front' in resource && resource.front) || '—'}
                  </p>
                </div>
                <div
                  className="rounded-2xl p-6 flex flex-col gap-2"
                  style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}
                >
                  <span className="text-[11px] font-bold text-slate-400 uppercase">Verso</span>
                  <p className="text-base text-slate-700 dark:text-dark-200">
                    {('back' in resource && resource.back) || '—'}
                  </p>
                </div>
              </>
            )}

            {type === 'question' && (
              <QuestionCard question={resource as PublicQuestion} explanation={(resource as PublicQuestion).explanation} />
            )}

            {type === 'mockExam' && (
              <div className="flex flex-col gap-3">
                {(resource as PublicMockExam).description && (
                  <p className="text-sm text-slate-500 dark:text-dark-400">
                    {(resource as PublicMockExam).description}
                  </p>
                )}
                {(resource as PublicMockExam).questions.map((q, index) => (
                  <div key={q.id}>
                    <p className="text-xs font-bold text-slate-400 dark:text-dark-500 mb-2">
                      Questão {index + 1}
                    </p>
                    <QuestionCard question={q} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default PublicContentView;