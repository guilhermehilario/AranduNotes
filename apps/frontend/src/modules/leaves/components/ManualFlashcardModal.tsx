import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal } from '../../../components/ui/Modal.tsx';
import { Button } from '../../../components/ui/Button.tsx';
import { useToastStore } from '../../../store/toastStore';
import { extractApiError } from '../../../utils/api-errors';
import { Input } from '../../../components/ui/Input.tsx';
import { TextArea } from '../../../components/ui/TextArea.tsx';
import studyService from '../../study/services/studyService';

interface ManualFlashcardModalProps {
  isOpen: boolean;
  onClose: () => void;
  leafId: string;
  notebookId: string;
}

export const ManualFlashcardModal: React.FC<ManualFlashcardModalProps> = ({
  isOpen,
  onClose,
  leafId,
  notebookId,
}) => {
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: {
      leafId: string;
      notebookId: string;
      front: string;
      back: string;
    }) => studyService.createFlashcard(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['leaves', leafId, 'flashcards'],
      });
      queryClient.invalidateQueries({
        queryKey: ['notebook-flashcards', notebookId],
      });
      // ✅ Invalida as estatísticas para refletir novos cards no Dashboard
      queryClient.invalidateQueries({ queryKey: ['study-stats'] });
      handleClose();
    },
  });

  const handleCreate = async () => {
    if (!leafId || !notebookId || !front.trim() || !back.trim()) return;
    try {
      await createMutation.mutateAsync({
        leafId,
        notebookId,
        front: front.trim(),
        back: back.trim(),
      });
    } catch (err) {
      useToastStore.getState().addToast(extractApiError(err, 'Erro ao criar flashcard manual.'), 'error');
    }
  };

  const handleClose = () => {
    setFront('');
    setBack('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Criar Flashcard Manual"
      footer={
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleCreate}
            disabled={
              !front.trim() || !back.trim() || createMutation.isPending
            }
          >
            {createMutation.isPending ? 'Criando...' : 'Criar Flashcard'}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <Input
          label="Pergunta (Frente)"
          placeholder="Ex: Qual a fórmula do teorema de Pitágoras?"
          value={front}
          onChange={(e) => setFront(e.target.value)}
        />
        <TextArea
          label="Resposta (Verso)"
          placeholder="Ex: a² + b² = c², onde c é a hipotenusa..."
          rows={4}
          value={back}
          onChange={(e) => setBack(e.target.value)}
        />
      </div>
    </Modal>
  );
};

export default ManualFlashcardModal;
