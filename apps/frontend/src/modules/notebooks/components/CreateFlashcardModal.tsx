import React from 'react';
import type { UseFormRegister, UseFormHandleSubmit, FieldErrors } from 'react-hook-form';
import { Modal } from '../../../components/ui/Modal.tsx';
import { Button } from '../../../components/ui/Button.tsx';
import { Input } from '../../../components/ui/Input.tsx';
import { TextArea } from '../../../components/ui/TextArea.tsx';

interface FlashcardFormData {
  front: string;
  back: string;
}

interface LeafOption {
  id: string;
  title: string;
}

interface CreateFlashcardModalProps {
  isOpen: boolean;
  onClose: () => void;
  leaves: LeafOption[];
  selectedLeafId: string;
  setSelectedLeafId: (id: string) => void;
  registerFc: UseFormRegister<FlashcardFormData>;
  handleSubmitFc: UseFormHandleSubmit<FlashcardFormData>;
  fcErrors: FieldErrors<FlashcardFormData>;
  onFlashcardSubmit: (data: FlashcardFormData) => Promise<void>;
  isPending: boolean;
}

export const CreateFlashcardModal: React.FC<CreateFlashcardModalProps> = ({
  isOpen,
  onClose,
  leaves,
  selectedLeafId,
  setSelectedLeafId,
  registerFc,
  handleSubmitFc,
  fcErrors,
  onFlashcardSubmit,
  isPending,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Criar Flashcard Manualmente"
      footer={
        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmitFc(onFlashcardSubmit)}
            disabled={isPending}
          >
            {isPending ? "Criando..." : "Criar Flashcard"}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700 dark:text-dark-200">
            Vincular à Folha
          </label>
          <select
            value={selectedLeafId}
            onChange={(e) => setSelectedLeafId(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700 rounded-xl text-slate-900 dark:text-dark-50 focus:outline-none focus:ring-4 focus:ring-brand-100 dark:focus:ring-brand-900/20 focus:border-brand-500 transition-all duration-200 cursor-pointer"
          >
            <option value="">Selecione uma folha...</option>
            {leaves.map((leaf) => (
              <option key={leaf.id} value={leaf.id}>
                {leaf.title}
              </option>
            ))}
          </select>
        </div>
        <Input
          label="Pergunta (Frente)"
          placeholder="Ex: Qual a fórmula do teorema de Pitágoras?"
          error={fcErrors.front?.message}
          {...registerFc("front", {
            required: "A pergunta é obrigatória",
          })}
        />
        <TextArea
          label="Resposta (Verso)"
          placeholder="Ex: a² + b² = c², onde c é a hipotenusa..."
          rows={4}
          {...registerFc("back", { required: "A resposta é obrigatória" })}
        />
        {fcErrors.back?.message && (
          <p className="text-xs text-rose-500 mt-1">
            {fcErrors.back.message}
          </p>
        )}
      </div>
    </Modal>
  );
};


