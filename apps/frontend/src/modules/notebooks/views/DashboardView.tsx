import React, { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, BookOpen, BarChart3, ArrowDown, ArrowUp } from 'lucide-react';
import { useNotebooks } from '../hooks/useNotebooks';
import { CreateNotebookSchema } from '../types';
import type { CreateNotebookInput, Notebook } from '../types';
import { PageContainer } from '../../../components/ui/PageContainer.tsx';
import { NotebookCard } from '../components/NotebookCard.tsx';
import { StudyProgressSummaryModal } from '../../../modules/study/components/StudyProgressSummaryModal.tsx';
import { Button } from '../../../components/ui/Button.tsx';
import { Modal } from '../../../components/ui/Modal.tsx';
import { Input } from '../../../components/ui/Input.tsx';
import { TextArea } from '../../../components/ui/TextArea.tsx';
import { ColorPicker } from '../../../components/ui/ColorPicker.tsx';
import { EmptyState } from '../../../components/ui/EmptyState.tsx';
import { LoadingScreen } from '../../../components/ui/LoadingScreen.tsx';
import { ShareModal } from '../../../modules/sharing/components/ShareModal.tsx';
import { NOTEBOOK_COLORS } from '../../notebooks/constants';
import { useToastStore } from '../../../store/toastStore';
import { extractApiError } from '../../../utils/api-errors';
import { PlanningWeeklySummary } from '../../../modules/planning/components/PlanningWeeklySummary.tsx';

type SortField = 'createdAt' | 'title';
type SortDirection = 'asc' | 'desc';

/** Opções de ordenação — cada uma tem sua direção padrão natural */
const SORT_FIELDS: { id: SortField; label: string; defaultDirection: SortDirection }[] = [
  { id: 'createdAt', label: 'Data de criação', defaultDirection: 'desc' },
  { id: 'title', label: 'Nome', defaultDirection: 'asc' },
];

export const DashboardView: React.FC = () => {
  const { notebooks, isLoading, createNotebook } = useNotebooks();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState<string>(NOTEBOOK_COLORS[0]);
  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);
  const [notebookToShare, setNotebookToShare] = useState<Notebook | null>(null);

  // ── Ordenação ──
  // Default: último criado na frente (createdAt desc)
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const sortedNotebooks = useMemo(() => {
    const list = [...notebooks];
    list.sort((a, b) => {
      const cmp =
        sortField === 'title'
          ? a.title.localeCompare(b.title, 'pt-BR', {
              sensitivity: 'base',
              numeric: true,
            })
          : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return sortDirection === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [notebooks, sortField, sortDirection]);

  const handleSortFieldChange = (field: SortField) => {
    setSortField(field);
    // Ao trocar o campo, volta para a direção natural (data → recente, nome → A-Z)
    setSortDirection(SORT_FIELDS.find((f) => f.id === field)?.defaultDirection ?? 'asc');
  };

  const directionLabel =
    sortField === 'createdAt'
      ? sortDirection === 'desc'
        ? 'Mais recentes'
        : 'Mais antigas'
      : sortDirection === 'asc'
        ? 'A–Z'
        : 'Z–A';

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateNotebookInput>({
    resolver: zodResolver(CreateNotebookSchema),
    defaultValues: {
      title: '',
      description: '',
      color: NOTEBOOK_COLORS[0],
    },
  });

  const onSubmit = async (data: CreateNotebookInput) => {
    try {
      await createNotebook({
        ...data,
        color: selectedColor,
      });
      setIsModalOpen(false);
      reset();
      setSelectedColor(NOTEBOOK_COLORS[0]);
    } catch (error) {
      useToastStore.getState().addToast(extractApiError(error, 'Erro ao criar caderno.'), 'error');
    }
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <PageContainer gap="8">
      {/* Progresso dos Estudos Modal */}
      <StudyProgressSummaryModal
        isOpen={isProgressModalOpen}
        onClose={() => setIsProgressModalOpen(false)}
      />

      {/* Weekly Planning Summary */}
      <PlanningWeeklySummary />

      {/* Top Welcome Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <p className="text-sm sm:text-base text-slate-500 dark:text-dark-350">
          Gerencie seus materiais universitários e crie resumos de forma organizada
        </p>
        <div className="flex items-center gap-2 sm:gap-3 self-start md:self-auto w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={() => setIsProgressModalOpen(true)}
            leftIcon={<BarChart3 className="h-4 w-4" />}
          >
            Progresso
          </Button>
          <Button
            onClick={() => setIsModalOpen(true)}
            leftIcon={<Plus className="h-5 w-5" />}
            className="shadow-md shadow-brand-500/10"
          >
            Novo Caderno
          </Button>
        </div>
      </div>

      {/* Notebook Grid */}
      <div className="mt-6">
        {notebooks.length === 0 ? (
          <EmptyState
            icon={<BookOpen className="h-8 w-8" />}
            title="Nenhum caderno criado"
            description="Comece criando o seu primeiro caderno para separar suas disciplinas da faculdade."
            action={
              <Button
                variant="outline"
                onClick={() => setIsModalOpen(true)}
                leftIcon={<Plus className="h-4 w-4" />}
              >
                Criar meu primeiro caderno
              </Button>
            }
          />
        ) : (
          <div className="flex flex-col gap-6">
            {/* Sort Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs font-semibold text-slate-400 dark:text-dark-400">
                {notebooks.length} {notebooks.length === 1 ? 'caderno' : 'cadernos'}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-slate-400 dark:text-dark-400">
                  Ordenar por
                </span>
                {/* Seletor de campo de ordenação */}
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-dark-900 rounded-xl p-1 w-fit">
                  {SORT_FIELDS.map((field) => (
                    <button
                      key={field.id}
                      type="button"
                      aria-pressed={sortField === field.id}
                      onClick={() => handleSortFieldChange(field.id)}
                      className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer ${
                        sortField === field.id
                          ? 'bg-white dark:bg-dark-800 text-slate-800 dark:text-dark-50 shadow-sm'
                          : 'text-slate-500 dark:text-dark-400 hover:text-slate-700 dark:hover:text-dark-200'
                      }`}
                    >
                      {field.label}
                    </button>
                  ))}
                </div>
                {/* Inverter ordem */}
                <button
                  type="button"
                  onClick={() => setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'))}
                  title="Inverter ordem"
                  aria-label={`Inverter ordem de ${sortField === 'createdAt' ? 'data de criação' : 'nome'} (${directionLabel})`}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer border border-slate-200 dark:border-dark-700 text-slate-500 dark:text-dark-400 hover:text-slate-700 dark:hover:text-dark-200 hover:border-brand-300 dark:hover:border-brand-700"
                >
                  {sortDirection === 'desc' ? (
                    <ArrowDown className="h-3.5 w-3.5" />
                  ) : (
                    <ArrowUp className="h-3.5 w-3.5" />
                  )}
                  {directionLabel}
                </button>
              </div>
            </div>

            {/* Notebook Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedNotebooks.map((notebook) => (
                <NotebookCard
                  key={notebook.id}
                  notebook={notebook}
                  onShare={() => setNotebookToShare(notebook)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Creation Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          reset();
        }}
        title="Criar Novo Caderno"
        footer={
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setIsModalOpen(false);
                reset();
              }}
            >
              Cancelar
            </Button>
            <Button type="submit" form="create-notebook-form">Criar Caderno</Button>
          </div>
        }
      >
        <form id="create-notebook-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
          <Input
            label="Título do Caderno"
            placeholder="Ex: Engenharia de Software II, Cálculo III"
            error={errors.title?.message}
            {...register('title')}
          />

          <TextArea
            label="Descrição (Opcional)"
            placeholder="Uma breve descrição sobre este caderno..."
            rows={3}
            {...register('description')}
          />

          <ColorPicker
            colors={NOTEBOOK_COLORS}
            selectedColor={selectedColor}
            onChange={setSelectedColor}
            label="Cor de Identificação"
          />
        </form>
      </Modal>

      {/* Share Modal */}
      <ShareModal
        isOpen={!!notebookToShare}
        onClose={() => setNotebookToShare(null)}
        resourceType="notebook"
        resourceId={notebookToShare?.id || ''}
        title={notebookToShare?.title || ''}
        initialIsPublic={notebookToShare?.isPublic}
        initialToken={notebookToShare?.publicToken ?? null}
      />
    </PageContainer>
  );
};
export default DashboardView;
