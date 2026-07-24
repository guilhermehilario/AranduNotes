import React, { useState, useEffect } from 'react';
import { Modal } from '../../../components/ui/Modal.tsx';
import { Button } from '../../../components/ui/Button.tsx';
import { Input } from '../../../components/ui/Input.tsx';
import { TextArea } from '../../../components/ui/TextArea.tsx';
import type { Flashcard } from '../../study/types';

interface EditFlashcardModalProps {
  isOpen: boolean;
  onClose: () => void;
  flashcard: Flashcard | null;
  onSave: (cardId: string, data: { front: string; back: string }) => Promise<void>;
  onDelete: (cardId: string) => Promise<void>;
  isSaving: boolean;
  isDeleting: boolean;
}

export const EditFlashcardModal: React.FC<EditFlashcardModalProps> = ({
  isOpen,
  onClose,
  flashcard,
  onSave,
  onDelete,
  isSaving,
  isDeleting,
}) => {
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');

  useEffect(() => {
    if (flashcard) {
      setFront(flashcard.front);
      setBack(flashcard.back);
    } else {
      setFront('');
      setBack('');
    }
  }, [flashcard]);

  const handleSave = async () => {
    if (!flashcard || !front.trim() || !back.trim()) return;
    await onSave(flashcard.id, { front: front.trim(), back: back.trim() });
  };

  const handleDelete = async () => {
    if (!flashcard) return;
    await onDelete(flashcard.id);
  };

  const handleClose = () => {
    setFront('');
    setBack('');
    onClose();
  };

  const isPending = isSaving || isDeleting;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Editar Flashcard"
      footer={
        <div className="flex gap-3 w-full justify-between">
          <Button
            variant="danger"
            onClick={handleDelete}
            disabled={isPending || !flashcard}
          >
            {isDeleting ? 'Excluindo...' : 'Excluir'}
          </Button>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleClose} disabled={isPending}>
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={!front.trim() || !back.trim() || isPending}
            >
              {isSaving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
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

export default EditFlashcardModal;
