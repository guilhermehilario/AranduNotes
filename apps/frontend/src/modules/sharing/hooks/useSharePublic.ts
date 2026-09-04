import { useState } from 'react';
import { buildPublicUrl } from '../types';
import { useToastStore } from '../../../store/toastStore';
import { extractApiError } from '../../../utils/api-errors';
import type { SetPublicResult } from '../types';

interface UseSharePublicParams {
  notebookId: string;
  isPublic?: boolean;
  publicToken?: string | null;
  setPublic: (isPublic: boolean) => Promise<SetPublicResult>;
}

export function useSharePublic({
  notebookId,
  isPublic = false,
  publicToken = null,
  setPublic,
}: UseSharePublicParams) {
  const addToast = useToastStore((s) => s.addToast);
  const [publ, setPubl] = useState(isPublic);
  const [token, setToken] = useState<string | null>(publicToken);
  const [isLinkCopied, setIsLinkCopied] = useState(false);

  const handleTogglePublic = async () => {
    try {
      const result = await setPublic(!publ);
      setPubl(result.isPublic);
      setToken(result.publicToken);
    } catch (error) {
      addToast(
        extractApiError(error, 'Não foi possível alterar o acesso público.'),
        'error',
      );
    }
  };

  const handleCopyLink = async () => {
    if (!token) return;
    const url = buildPublicUrl('notebook', notebookId, token);
    try {
      await navigator.clipboard.writeText(url);
      setIsLinkCopied(true);
      setTimeout(() => setIsLinkCopied(false), 2000);
    } catch {
      addToast('Não foi possível copiar o link.', 'error');
    }
  };

  return { publ, token, isLinkCopied, handleTogglePublic, handleCopyLink };
}