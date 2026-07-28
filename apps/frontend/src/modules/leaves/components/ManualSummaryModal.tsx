import React, { useState, useEffect } from 'react';
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

export const ManualSummaryModal: React.FC<ManualSummaryModalProps> = ({
  isOpen,
  onClose,
  leafId,
  currentSummary,
}) => {
  const [summaryText, setSummaryText] = useState(currentSummary ?? '');
  const queryClient = useQueryClient();

  useEffect(() => {
    if (isOpen) {
      setSummaryText(currentSummary ?? '');
    }
  }, [isOpen, currentSummary]);

  const saveMutation = useMutation({
    mutationFn: (text: string) =>
      leafService.updateLeaf(leafId, { summary: text || null }),
    onSuccess: (updatedLeaf) => {
      // ⚡ Atualiza o cache individual da leaf com o novo sumário
      queryClient.setQueryData<Leaf>(
        ['leaves', leafId],
        (old: Leaf | undefined) => {
          if (!old) return updatedLeaf as unknown as Leaf;
          return { ...old, summary: updatedLeaf.summary ?? old.summary };
        },
      );
      // ⚡ Atualiza o cache do sumário (usado em useLeaf > summaryCache)
      queryClient.setQueryData<{ summary?: string }>(
        ['leaves', leafId, 'summary'],
        { summary: updatedLeaf.summary ?? undefined },
      );
      useToastStore.getState().addToast('Resumo salvo com sucesso.', 'success');
      handleClose();
    },
    onError: (err) => {
      useToastStore
        .getState()
        .addToast(extractApiError(err, 'Erro ao salvar resumo.'), 'error');
    },
  });

  const handleSave = async () => {
    try {
      await saveMutation.mutateAsync(summaryText);
    } catch {
      // Toast já exibido no onError
    }
  };

  const handleClose = () => {
    setSummaryText(currentSummary ?? '');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Criar Resumo Manual"
      footer={
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? 'Salvando...' : 'Salvar Resumo'}
          </Button>
        </div>
      }
    >
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
    </Modal>
  );
};

export default ManualSummaryModal;
