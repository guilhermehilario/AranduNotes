import React, { useState } from 'react';
import { Modal } from '../../../components/ui/Modal.tsx';
import { Button } from '../../../components/ui/Button.tsx';
import { Input } from '../../../components/ui/Input.tsx';
import { TextArea } from '../../../components/ui/TextArea.tsx';
import type { CreateExamFromQuestionsInput } from '../types';

type ExamDraft = Omit<CreateExamFromQuestionsInput, 'questionIds'>;

interface CreateExamFromQuestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  count: number;
  defaultNotebookId?: string;
  onSubmit: (data: ExamDraft) => Promise<void>;
  isPending: boolean;
}

export const CreateExamFromQuestionsModal: React.FC<
  CreateExamFromQuestionsModalProps
> = ({ isOpen, onClose, count, defaultNotebookId, onSubmit, isPending }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Criar Simulado"
      size="md"
      footer={null}
    >
      <CreateExamForm
        key={`${isOpen}-${count}`}
        count={count}
        defaultNotebookId={defaultNotebookId}
        onSubmit={onSubmit}
        isPending={isPending}
        onClose={onClose}
      />
    </Modal>
  );
};

const CreateExamForm: React.FC<{
  count: number;
  defaultNotebookId?: string;
  onSubmit: (data: ExamDraft) => Promise<void>;
  isPending: boolean;
  onClose: () => void;
}> = ({ count, defaultNotebookId, onSubmit, isPending, onClose }) => {
  const [title, setTitle] = useState(`Simulado com ${count} questões`);
  const [timeLimit, setTimeLimit] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError('O título é obrigatório.');
      return;
    }
    const parsedTime = timeLimit ? Number(timeLimit) : undefined;
    if (timeLimit && (!Number.isFinite(parsedTime) || parsedTime! < 1)) {
      setError('O tempo limite deve ser um número positivo de minutos.');
      return;
    }

    setError('');
    await onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      timeLimit: parsedTime,
      notebookId: defaultNotebookId || undefined,
    });
  };

  return (
    <>
      <div className="flex flex-col gap-4">
        <p className="text-sm text-slate-500 dark:text-dark-400">
          {count} {count === 1 ? 'questão selecionada' : 'questões selecionadas'}.
        </p>
        <Input
          label="Título"
          placeholder="Ex: Simulado de Citologia"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
        />
        <Input
          label="Tempo limite (minutos, opcional)"
          placeholder="Ex: 30"
          type="number"
          min={1}
          value={timeLimit}
          onChange={(e) => setTimeLimit(e.target.value)}
        />
        <TextArea
          label="Descrição (opcional)"
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        {error && <p className="text-sm text-rose-500 font-medium">{error}</p>}
      </div>
      <div className="flex justify-end gap-3 mt-6">
        <Button variant="outline" onClick={onClose} disabled={isPending}>
          Cancelar
        </Button>
        <Button onClick={handleSubmit} isLoading={isPending}>
          Criar Simulado
        </Button>
      </div>
    </>
  );
};

export default CreateExamFromQuestionsModal;