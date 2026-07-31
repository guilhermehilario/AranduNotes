import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal } from '../../../components/ui/Modal.tsx';
import { Button } from '../../../components/ui/Button.tsx';
import { TextArea } from '../../../components/ui/TextArea.tsx';
import { useToastStore } from '../../../store/toastStore';
import { extractApiError } from '../../../utils/api-errors';
import leafService from '../services/leafService';
import type { Leaf } from '../types';

interface ManualSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  leafId: string;
  currentSummary?: string | null;
}

const SummaryForm: React.FC<{
  currentSummary?: string | null;
  onSave: (text: string) => Promise<void>;
  onCancel: () => void;
}> = ({ currentSummary, onSave, onCancel }) => {
  const [summaryText, setSummaryText] = useState(currentSummary ?? '');

  return (
    <>
      <div className="flex flex-col gap-4">
        <TextArea
          label="Resumo"
          placeholder="Digite seu resumo aqui... Você pode usar Markdown para formatar o texto."
          rows={8}
          value={summaryText}
          onChange={(e) => setSummaryText(e.target.value)}
        />
        <p
          className="text-xs leading-relaxed"
          style={{ color: 'var(--text-secondary)' }}
        >
          O resumo será exibido na aba de resumo da folha. Você pode usar
          Markdown para formatação (negrito, itálico, listas, etc.).
        </p>
      </div>
      <div className="flex gap-3 mt-4">
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button onClick={() => onSave(summaryText)}>
          Salvar Resumo
        </Button>
      </div>
    </>
  );
};

export const ManualSummaryModal: React.FC<ManualSummaryModalProps> = ({
  isOpen,
  onClose,
  leafId,
  currentSummary,
}) => {
  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: (text: string) =>
      leafService.updateLeaf(leafId, { summary: text || null }),
    onSuccess: (updatedLeaf) => {
      queryClient.setQueryData<Leaf>(
        ['leaves', leafId],
        (old: Leaf | undefined) => {
          if (!old) return updatedLeaf as unknown as Leaf;
          return { ...old, summary: updatedLeaf.summary ?? old.summary };
        },
      );
      queryClient.setQueryData<{ summary?: string }>(
        ['leaves', leafId, 'summary'],
        { summary: updatedLeaf.summary ?? undefined },
      );
      useToastStore.getState().addToast('Resumo salvo com sucesso.', 'success');
      onClose();
    },
    onError: (err) => {
      useToastStore
        .getState()
        .addToast(extractApiError(err, 'Erro ao salvar resumo.'), 'error');
    },
  });

  const handleSave = async (text: string) => {
    try {
      await saveMutation.mutateAsync(text);
    } catch {
      // Toast já exibido no onError
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Criar Resumo Manual"
      footer={null}
    >
      {/* key força remount quando o modal abre com dados atualizados */}
      <SummaryForm
        key={`${isOpen}-${currentSummary ?? ''}`}
        currentSummary={currentSummary}
        onSave={handleSave}
        onCancel={onClose}
      />
    </Modal>
  );
};

export default ManualSummaryModal;
