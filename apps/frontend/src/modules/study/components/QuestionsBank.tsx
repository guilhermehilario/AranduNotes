import React, { useMemo, useState } from 'react';
import {
  Plus,
  RefreshCw,
  Filter,
  ClipboardList,
  ListChecks,
  Pencil,
  Trash2,
  Timer,
  GraduationCap,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../../components/ui/Card.tsx';
import { Button } from '../../../components/ui/Button.tsx';
import { Input } from '../../../components/ui/Input.tsx';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog.tsx';
import {
  useQuestions,
  useCreateQuestion,
  useUpdateQuestion,
  useDeleteQuestion,
} from '../hooks/useQuestions';
import { useCreateMockExamFromQuestions } from '../hooks/useMockExams';
import { QuestionFormModal } from './QuestionFormModal.tsx';
import { CreateExamFromQuestionsModal } from './CreateExamFromQuestionsModal.tsx';
import { safeParseOptions } from '../../../utils/parse-options';
import type { Question, CreateQuestionInput } from '../types';

interface NotebookOption {
  id: string;
  title: string;
  color: string;
}

interface QuestionsBankProps {
  notebooks: NotebookOption[];
  initialNotebookId?: string;
}

const TYPE_LABELS: Record<string, string> = {
  multiple_choice: 'Múltipla escolha',
  true_false: 'Verdadeiro/Falso',
  short_answer: 'Resposta curta',
  dissertative: 'Dissertativa',
};

const TYPE_CLASSES: Record<string, string> = {
  multiple_choice: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400',
  true_false: 'bg-sky-50 text-sky-600 dark:bg-sky-950/30 dark:text-sky-400',
  short_answer: 'bg-violet-50 text-violet-600 dark:bg-violet-950/30 dark:text-violet-400',
  dissertative: 'bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400',
};

export const QuestionsBank: React.FC<QuestionsBankProps> = ({
  notebooks,
  initialNotebookId,
}) => {
  const navigate = useNavigate();

  const [filters, setFilters] = useState<{
    notebookId: string;
    theme: string;
    questionType: string;
  }>({
    notebookId: initialNotebookId || '',
    theme: '',
    questionType: '',
  });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Question | null>(null);
  const [creatingExam, setCreatingExam] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Question | null>(null);

  const { data: questions = [], isLoading } = useQuestions({
    notebookId: filters.notebookId || undefined,
    theme: filters.theme || undefined,
    questionType: filters.questionType || undefined,
  });
  const createQuestion = useCreateQuestion();
  const updateQuestion = useUpdateQuestion();
  const deleteQuestion = useDeleteQuestion();
  const createExam = useCreateMockExamFromQuestions();

  const themes = useMemo(() => {
    const set = new Set<string>();
    (questions as Question[]).forEach((q) => {
      if (q.theme) set.add(q.theme);
    });
    return [...set].sort();
  }, [questions]);

  const selectedCount = selectedIds.size;

  const handleFilterChange = (patch: Partial<typeof filters>) => {
    setFilters((prev) => ({ ...prev, ...patch }));
    setSelectedIds(new Set());
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === questions.length && questions.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(questions.map((q) => q.id)));
    }
  };

  const handleSubmitQuestion = async (data: CreateQuestionInput) => {
    if (editing) {
      await updateQuestion.mutateAsync({ id: editing.id, data });
      setEditing(null);
    } else {
      const created = await createQuestion.mutateAsync(data);
      setSelectedIds((prev) => new Set(prev).add(created.id));
      setShowCreate(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteQuestion.mutateAsync(deleteTarget.id);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(deleteTarget.id);
      return next;
    });
    setDeleteTarget(null);
  };

  const handleCreateExam = async (data: {
    title: string;
    description?: string;
    timeLimit?: number;
  }) => {
    const exam = await createExam.mutateAsync({
      title: data.title,
      description: data.description,
      timeLimit: data.timeLimit,
      notebookId: filters.notebookId || undefined,
      questionIds: [...selectedIds],
    });
    if (exam) {
      setSelectedIds(new Set());
      setCreatingExam(false);
      navigate(
        `/studies/mock-exams${filters.notebookId ? `?notebookId=${filters.notebookId}` : ''}`,
      );
    }
  };

  const hasFilters = filters.notebookId || filters.theme || filters.questionType;

  return (
    <div className="flex flex-col gap-4">
      {/* Actions + filters */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <Button
            onClick={() => setShowCreate(true)}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Nova Questão
          </Button>
          {selectedCount > 0 && (
            <Button
              onClick={() => setCreatingExam(true)}
              leftIcon={<Timer className="h-4 w-4" />}
              disabled={createExam.isPending}
            >
              Criar Simulado ({selectedCount})
            </Button>
          )}
        </div>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="h-4 w-4 text-slate-400" />
            <span className="text-sm font-bold text-slate-700 dark:text-dark-200">
              Filtros
            </span>
            {hasFilters && (
              <button
                type="button"
                onClick={() =>
                  handleFilterChange({ notebookId: '', theme: '', questionType: '' })
                }
                className="ml-auto text-xs font-semibold text-brand-500 hover:text-brand-600 cursor-pointer"
              >
                Limpar filtros
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-500 dark:text-dark-400">
                Caderno
              </label>
              <select
                value={filters.notebookId}
                onChange={(e) => handleFilterChange({ notebookId: e.target.value })}
                className="w-full px-3 py-2 bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700 rounded-xl text-sm text-slate-900 dark:text-dark-50 focus:outline-none focus:border-brand-500 transition-all cursor-pointer"
              >
                <option value="">Todos os cadernos</option>
                {notebooks.map((nb) => (
                  <option key={nb.id} value={nb.id}>
                    {nb.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-500 dark:text-dark-400">
                Tema
              </label>
              <Input
                placeholder="Buscar por tema..."
                value={filters.theme}
                onChange={(e) => handleFilterChange({ theme: e.target.value })}
                className="py-2 text-sm"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-500 dark:text-dark-400">
                Tipo
              </label>
              <select
                value={filters.questionType}
                onChange={(e) => handleFilterChange({ questionType: e.target.value })}
                className="w-full px-3 py-2 bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700 rounded-xl text-sm text-slate-900 dark:text-dark-50 focus:outline-none focus:border-brand-500 transition-all cursor-pointer"
              >
                <option value="">Todos os tipos</option>
                <option value="multiple_choice">Múltipla escolha</option>
                <option value="dissertative">Dissertativa</option>
                <option value="true_false">Verdadeiro/Falso</option>
                <option value="short_answer">Resposta curta</option>
              </select>
            </div>
          </div>
          {themes.length > 0 && !filters.notebookId && !filters.questionType && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {themes.slice(0, 12).map((theme) => (
                <button
                  key={theme}
                  type="button"
                  onClick={() =>
                    handleFilterChange({
                      theme: filters.theme === theme ? '' : theme,
                    })
                  }
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                    filters.theme === theme
                      ? 'bg-brand-500 text-white border-brand-500'
                      : 'bg-slate-50 dark:bg-dark-800 text-slate-600 dark:text-dark-300 border-slate-200 dark:border-dark-700 hover:border-brand-300'
                  }`}
                >
                  {theme}
                </button>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="h-40 flex items-center justify-center">
          <RefreshCw className="h-8 w-8 animate-spin text-brand-500" />
        </div>
      ) : questions.length === 0 ? (
        <Card className="p-8 text-center">
          <ClipboardList className="h-12 w-12 mx-auto text-slate-300 dark:text-dark-600 mb-3" />
          <h3 className="text-lg font-heading font-bold text-slate-800 dark:text-dark-50 mb-1">
            Nenhuma questão encontrada
          </h3>
          <p className="text-sm text-slate-500 dark:text-dark-400 mb-4">
            {hasFilters
              ? 'Ajuste os filtros ou crie uma nova questão.'
              : 'Crie sua primeira questão para começar a montar simulados.'}
          </p>
          {!hasFilters && (
            <Button onClick={() => setShowCreate(true)} leftIcon={<Plus className="h-4 w-4" />}>
              Nova Questão
            </Button>
          )}
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={toggleSelectAll}
              className="flex items-center gap-1.5 text-xs font-semibold text-brand-500 hover:text-brand-600 cursor-pointer"
            >
              <ListChecks className="h-3.5 w-3.5" />
              {selectedIds.size === questions.length
                ? 'Desmarcar todas'
                : `Selecionar todas (${questions.length})`}
            </button>
            <span className="text-xs text-slate-400 dark:text-dark-500">
              {questions.length} {questions.length === 1 ? 'questão' : 'questões'}
            </span>
          </div>

          {questions.map((q) => {
            const optionCount = safeParseOptions(q.options).length;
            const isSelected = selectedIds.has(q.id);
            return (
              <Card
                key={q.id}
                className={`p-4 transition-all duration-200 ${
                  isSelected
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/10 ring-1 ring-brand-500/30'
                    : 'hover:shadow-md'
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelect(q.id)}
                    aria-label="Selecionar questão"
                    className="mt-1 w-4 h-4 accent-brand-500 cursor-pointer flex-shrink-0"
                  />
                  <div className="flex-grow min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                          TYPE_CLASSES[q.questionType] || ''
                        }`}
                      >
                        {TYPE_LABELS[q.questionType] || q.questionType}
                      </span>
                      {q.theme && (
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 dark:bg-dark-800 text-slate-600 dark:text-dark-300">
                          {q.theme}
                        </span>
                      )}
                      {q.notebook && (
                        <span
                          className="px-2 py-0.5 rounded-md text-[11px] font-semibold"
                          style={{
                            backgroundColor: `${q.notebook.color}15`,
                            color: q.notebook.color,
                          }}
                        >
                          {q.notebook.title}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-slate-800 dark:text-dark-50 mt-1.5 leading-relaxed">
                      {q.question}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-dark-500 mt-0.5">
                      {q.questionType === 'dissertative'
                        ? 'Resposta aberta (dissertativa)'
                        : `${optionCount} alternativas`}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => setEditing(q)}
                      aria-label="Editar questão"
                      className="p-2 rounded-lg text-slate-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-950/20 transition-all cursor-pointer"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(q)}
                      aria-label="Excluir questão"
                      className="p-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Selection hint */}
      {selectedCount > 0 && (
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-dark-400 bg-slate-50 dark:bg-dark-800/50 border border-slate-200 dark:border-dark-700 rounded-xl px-4 py-3">
          <GraduationCap className="h-4 w-4 text-amber-500" />
          <span>
            {selectedCount} selecionadas — use o botão{" "}
            <strong>Criar Simulado</strong> para montar uma prova com elas.
          </span>
        </div>
      )}

      {/* Modals */}
      <QuestionFormModal
        isOpen={showCreate || !!editing}
        onClose={() => {
          setShowCreate(false);
          setEditing(null);
        }}
        notebooks={notebooks}
        editing={editing}
        defaultNotebookId={filters.notebookId || undefined}
        onSubmit={handleSubmitQuestion}
        isPending={createQuestion.isPending || updateQuestion.isPending}
      />

      <CreateExamFromQuestionsModal
        isOpen={creatingExam}
        onClose={() => setCreatingExam(false)}
        count={selectedCount}
        defaultNotebookId={filters.notebookId || undefined}
        onSubmit={handleCreateExam}
        isPending={createExam.isPending}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Excluir Questão"
        message="Tem certeza que deseja excluir esta questão? Ela também será removida dos simulados que a utilizam."
        confirmLabel="Excluir"
        variant="danger"
        isLoading={deleteQuestion.isPending}
      />
    </div>
  );
};

export default QuestionsBank;