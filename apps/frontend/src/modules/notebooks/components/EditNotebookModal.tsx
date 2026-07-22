import React from 'react';
import type { UseFormRegister, FieldErrors } from 'react-hook-form';
import type { CreateNotebookInput } from '../types';
import { Modal } from '../../../components/ui/Modal.tsx';
import { Button } from '../../../components/ui/Button.tsx';
import { Input } from '../../../components/ui/Input.tsx';
import { TextArea } from '../../../components/ui/TextArea.tsx';
import { ColorPicker } from '../../../components/ui/ColorPicker.tsx';
import { NOTEBOOK_COLORS } from '../constants';

interface EditNotebookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e?: React.BaseSyntheticEvent) => void;
  register: UseFormRegister<CreateNotebookInput>;
  errors: FieldErrors<CreateNotebookInput>;
  selectedColor: string;
  setSelectedColor: (color: string) => void;
  actionError: string | null;
}

export const EditNotebookModal: React.FC<EditNotebookModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  register,
  errors,
  selectedColor,
  setSelectedColor,
  actionError,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Editar Caderno"
      footer={
        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="edit-notebook-form">
            Salvar Alterações
          </Button>
        </div>
      }
    >
      <form
        id="edit-notebook-form"
        onSubmit={onSubmit}
        className="flex flex-col gap-5"
      >
        <Input
          label="Título do Caderno"
          placeholder="Ex: Engenharia de Software II, Cálculo III"
          error={errors.title?.message}
          {...register("title")}
        />
        <TextArea
          label="Descrição (Opcional)"
          placeholder="Uma breve descrição sobre este caderno..."
          rows={3}
          {...register("description")}
        />
        <ColorPicker
          colors={NOTEBOOK_COLORS}
          selectedColor={selectedColor}
          onChange={setSelectedColor}
          label="Cor de Identificação"
        />
        {actionError && (
          <div className="p-3 rounded-xl text-sm font-medium bg-rose-50 text-rose-600 border border-rose-100 dark:bg-rose-950/20 dark:text-rose-400">
            {actionError}
          </div>
        )}
      </form>
    </Modal>
  );
};

