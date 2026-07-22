import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, BookOpen, BarChart3 } from 'lucide-react';
import { useNotebooks } from '../hooks/useNotebooks';
import { CreateNotebookSchema } from '../types';
import type { CreateNotebookInput } from '../types';
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
import { NOTEBOOK_COLORS } from '../../notebooks/constants';
import { useToastStore } from '../../../store/toastStore';
import { extractApiError } from '../../../utils/api-errors';
import { PlanningWeeklySummary } from '../../../modules/planning/components/PlanningWeeklySummary.tsx';

export const DashboardView: React.FC = () => {
  const { notebooks, isLoading, createNotebook } = useNotebooks();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState<string>(NOTEBOOK_COLORS[0]);
  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);

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
        <p className="text-slate-500 dark:text-dark-350">
          Gerencie seus materiais universitários e crie resumos de forma organizada
        </p>
        <div className="flex items-center gap-3 self-start md:self-auto">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {notebooks.map((notebook) => (
            <NotebookCard key={notebook.id} notebook={notebook} />
          ))}
        </div>
      )}

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
    </PageContainer>
  );
};
export default DashboardView;
