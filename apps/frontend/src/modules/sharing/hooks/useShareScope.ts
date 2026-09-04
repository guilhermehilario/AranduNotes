import { useState } from 'react';
import { useToastStore } from '../../../store/toastStore';
import { extractApiError } from '../../../utils/api-errors';
import type { Share } from '../types';
import type { FlatLeaf } from '../utils/flattenLeaves';

interface UseShareScopeParams {
  shares: Share[];
  flatLeaves: FlatLeaf[];
  setShareScope: (data: { shareId: string; leafIds: string[] }) => Promise<unknown>;
}

export function useShareScope({
  shares,
  flatLeaves,
  setShareScope,
}: UseShareScopeParams) {
  const addToast = useToastStore((s) => s.addToast);
  const [draftScope, setDraftScope] = useState<Record<string, string[]>>({});
  const [expandedShare, setExpandedShare] = useState<string | null>(null);
  const [savingScope, setSavingScope] = useState(false);

  const getScopeIds = (shareId: string, draft: Record<string, string[]>) => {
    const draftIds = draft[shareId];
    if (draftIds) return draftIds;
    const share = shares.find((s) => s.id === shareId);
    return share ? share.scope.map((s) => s.leafId) : [];
  };

  const currentScopeIds = (shareId: string) => getScopeIds(shareId, draftScope);

  const toggleExpanded = (shareId: string) =>
    setExpandedShare((cur) => (cur === shareId ? null : shareId));

  const toggleLeaf = (shareId: string, leafId: string) =>
    setDraftScope((prev) => {
      const cur = getScopeIds(shareId, prev);
      const next = cur.includes(leafId)
        ? cur.filter((id) => id !== leafId)
        : [...cur, leafId];
      return { ...prev, [shareId]: next };
    });

  const setFullAccess = (shareId: string) =>
    setDraftScope((prev) => ({ ...prev, [shareId]: [] }));

  const setScoped = (shareId: string) =>
    setDraftScope((prev) => {
      const cur = getScopeIds(shareId, prev);
      if (cur.length > 0) return prev;
      return { ...prev, [shareId]: flatLeaves.map((l) => l.id) };
    });

  const saveScope = async (shareId: string) => {
    setSavingScope(true);
    try {
      const leafIds = currentScopeIds(shareId);
      await setShareScope({ shareId, leafIds });
      setDraftScope((prev) => {
        const next = { ...prev };
        delete next[shareId];
        return next;
      });
      setExpandedShare(null);
      addToast(
        leafIds.length
          ? 'Compartilhamento restrito às folhas selecionadas.'
          : 'Acesso total concedido ao caderno.',
        'success',
      );
    } catch (error) {
      addToast(
        extractApiError(error, 'Não foi possível salvar a configuração.'),
        'error',
      );
    } finally {
      setSavingScope(false);
    }
  };

  return {
    currentScopeIds,
    expandedShare,
    toggleExpanded,
    toggleLeaf,
    setFullAccess,
    setScoped,
    saveScope,
    savingScope,
  };
}