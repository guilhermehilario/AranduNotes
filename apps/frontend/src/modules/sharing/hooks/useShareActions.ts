import { useState } from 'react';
import { useToastStore } from '../../../store/toastStore';
import { extractApiError } from '../../../utils/api-errors';
import type { Share, SharePermission } from '../types';

interface UseShareActionsParams {
  shares: Share[];
  removeShare: (shareId: string) => Promise<unknown>;
  updatePermission: (data: {
    shareId: string;
    permission: SharePermission;
  }) => Promise<unknown>;
}

export function useShareActions({
  shares,
  removeShare,
  updatePermission,
}: UseShareActionsParams) {
  const addToast = useToastStore((s) => s.addToast);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const handleRemove = async (shareId: string) => {
    setRemovingId(shareId);
    try {
      await removeShare(shareId);
    } catch (error) {
      addToast(
        extractApiError(error, 'Não foi possível remover o acesso.'),
        'error',
      );
    } finally {
      setRemovingId(null);
    }
  };

  const handleChangePermission = async (shareId: string) => {
    const share = shares.find((s) => s.id === shareId);
    if (!share) return;
    const next: SharePermission =
      share.permission === 'editor' ? 'viewer' : 'editor';
    try {
      await updatePermission({ shareId, permission: next });
      addToast(
        next === 'editor'
          ? 'Edição permitida para esta pessoa.'
          : 'Edição removida (somente visualização).',
        'success',
      );
    } catch (error) {
      addToast(
        extractApiError(error, 'Não foi possível alterar a permissão.'),
        'error',
      );
    }
  };

  return { removingId, handleRemove, handleChangePermission };
}