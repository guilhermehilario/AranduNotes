import React from 'react';
import type { UseFormRegister, FieldErrors } from 'react-hook-form';
import type { CreateLeafInput } from '../../leaves/types';
import { Modal } from '../../../components/ui/Modal.tsx';
import { Button } from '../../../components/ui/Button.tsx';
import { Input } from '../../../components/ui/Input.tsx';

interface CreateLeafModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e?: React.BaseSyntheticEvent) => void;
  register: UseFormRegister<CreateLeafInput>;
  errors: FieldErrors<CreateLeafInput>;
  parentLeafId: string | undefined;
  setParentLeafId: (id: string | undefined) => void;
  leaves: Array<{ id: string; title: string }>;
}

export const CreateLeafModal: React.FC<CreateLeafModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  register,
  errors,
  parentLeafId,
  setParentLeafId,
  leaves,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={parentLeafId ? "Criar Sub-folha" : "Criar Nova Folha"}
      footer={
        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="create-leaf-form">
            Criar e Editar
          </Button>
        </div>
      }
    >
      <form
        id="create-leaf-form"
        onSubmit={onSubmit}
        className="flex flex-col gap-4"
      >
        <Input
          label="Título da Folha"
          placeholder="Ex: Aula 01 - Introdução ao Protocolo HTTP"
          error={errors.title?.message}
          {...register("title")}
        />
        {!parentLeafId && leaves.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-dark-200">
              Folha Pai (opcional - cria sub-folha)
            </label>
            <select
              value={parentLeafId || ""}
              onChange={(e) =>
                setParentLeafId(e.target.value || undefined)
              }
              className="w-full px-3.5 py-2.5 bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700 rounded-xl text-slate-500 dark:text-dark-400 text-sm focus:outline-none focus:ring-4 focus:ring-brand-100 dark:focus:ring-brand-900/20 focus:border-brand-500 transition-all duration-200 cursor-pointer"
            >
              <option value="">Sem pai (folha raiz)</option>
              {leaves.map((leaf) => (
                <option key={leaf.id} value={leaf.id}>
                  {leaf.title}
                </option>
              ))}
            </select>
          </div>
        )}
        {parentLeafId && (
          <p className="text-xs text-brand-500 font-semibold">
            Esta será uma sub-folha de:{" "}
            {leaves.find((l) => l.id === parentLeafId)?.title || "..."}
          </p>
        )}
      </form>
    </Modal>
  );
};

