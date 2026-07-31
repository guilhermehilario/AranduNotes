import React, { useState } from 'react';
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

const FlashcardForm: React.FC<{
  flashcard: Flashcard | null;
  isSaving: boolean;
  isDeleting: boolean;
  onSave: (cardId: string, data: { front: string; back: string }) => Promise<void>;
  onDelete: (cardId: string) => Promise<void>;
  onClose: () => void;
}> = ({ flashcard, onSave, onDelete, onClose, isSaving, isDeleting }) => {
  const [front, setFront] = useState(flashcard?.front ?? '');
  const [back, setBack] = useState(flashcard?.back ?? '');

  const handleSave = async () => {
    if (!flashcard || !front.trim() || !back.trim()) return;
    await onSave(flashcard.id, { front: front.trim(), back: back.trim() });
  };

  const handleDelete = async () => {
    if (!flashcard) return;
    await onDelete(flashcard.id);
  };

  const isPending = isSaving || isDeleting;

  return (
    <>
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
      <div className="flex flex-col sm:flex-row gap-3 w-full sm:justify-between mt-4">
        <Button
          variant="danger"
          onClick={handleDelete}
          disabled={isPending || !flashcard}
          className="w-full sm:w-auto"
        >
          {isDeleting ? 'Excluindo...' : 'Excluir'}
        </Button>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Button variant="outline" onClick={onClose} disabled={isPending} className="w-full sm:w-auto">
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={!front.trim() || !back.trim() || isPending}
            className="w-full sm:w-auto"
          >
            {isSaving ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </div>
    </>
  );
};

export const EditFlashcardModal: React.FC<EditFlashcardModalProps> = ({
  isOpen,
  onClose,
  flashcard,
  onSave,
  onDelete,
  isSaving,
  isDeleting,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Editar Flashcard"
      footer={null}
    >
      {/* key força remount quando o flashcard muda entre aberturas */}
      <FlashcardForm
        key={`${isOpen}-${flashcard?.id ?? 'new'}`}
        flashcard={flashcard}
        isSaving={isSaving}
        isDeleting={isDeleting}
        onSave={onSave}
        onDelete={onDelete}
        onClose={onClose}
      />
    </Modal>
  );
};

export default EditFlashcardModal;
