import React, { useMemo, useState } from 'react';
import {
  Globe,
  Link2,
  Mail,
  UserX,
  Loader2,
  Check,
  ChevronDown,
  FileText,
  Pencil,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button.tsx';
import { Input } from '../../../components/ui/Input.tsx';
import { useShares } from '../hooks/useSharing';
import { useToastStore } from '../../../store/toastStore';
import { extractApiError } from '../../../utils/api-errors';
import { buildPublicUrl } from '../types';
import type { Leaf } from '../../leaves/types';

interface NotebookShareSettingsProps {
  notebookId: string;
  isPublic?: boolean;
  publicToken?: string | null;
  leaves: Leaf[];
}

interface FlatLeaf {
  id: string;
  title: string;
  depth: number;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function flattenLeaves(leaves: Leaf[], depth = 0): FlatLeaf[] {
  const result: FlatLeaf[] = [];
  for (const leaf of leaves) {
    result.push({ id: leaf.id, title: leaf.title, depth });
    if (leaf.children?.length) {
      result.push(...flattenLeaves(leaf.children, depth + 1));
    }
  }
  return result;
}

export const NotebookShareSettings: React.FC<NotebookShareSettingsProps> = ({
  notebookId,
  isPublic = false,
  publicToken = null,
  leaves,
}) => {
  const {
    shares,
    isLoadingShares,
    createShare,
    isCreating,
    removeShare,
    isRemoving,
    setPublic,
    isSettingPublic,
    setShareScope,
    isSettingScope,
    updatePermission,
    isUpdatingPermission,
  } = useShares('notebook', notebookId);

  const flatLeaves = useMemo(() => flattenLeaves(leaves), [leaves]);

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string>();
  const [publ, setPubl] = useState(isPublic);
  const [token, setToken] = useState<string | null>(publicToken);
  const [isLinkCopied, setIsLinkCopied] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [expandedShare, setExpandedShare] = useState<string | null>(null);
  const [savingScope, setSavingScope] = useState(false);
  const [draftScope, setDraftScope] = useState<Record<string, string[]>>({});

  const currentScopeIds = (shareId: string): string[] => {
    const draft = draftScope[shareId];
    if (draft) return draft;
    const share = shares.find((s) => s.id === shareId);
    return share ? share.scope.map((s) => s.leafId) : [];
  };

  const isScoped = (shareId: string) => currentScopeIds(shareId).length > 0;

  const toggleLeaf = (shareId: string, leafId: string) => {
    setDraftScope((prev) => {
      const cur = currentScopeIds(shareId);
      const next = cur.includes(leafId)
        ? cur.filter((id) => id !== leafId)
        : [...cur, leafId];
      return { ...prev, [shareId]: next };
    });
  };

  const setFullAccess = (shareId: string) => {
    setDraftScope((prev) => ({ ...prev, [shareId]: [] }));
  };

  const setScoped = (shareId: string) => {
    setDraftScope((prev) => {
      const cur = currentScopeIds(shareId);
      if (cur.length > 0) return prev;
      return { ...prev, [shareId]: flatLeaves.map((l) => l.id) };
    });
  };

  const handleAdd = async () => {
    const value = email.trim();
    if (!EMAIL_REGEX.test(value)) {
      setEmailError('Digite um e-mail válido.');
      return;
    }
    setEmailError(undefined);
    try {
      await createShare({ email: value });
      setEmail('');
      useToastStore.getState().addToast('Acesso compartilhado.', 'success');
    } catch (error) {
      useToastStore.getState().addToast(
        extractApiError(error, 'Não foi possível compartilhar.'),
        'error',
      );
    }
  };

  const handleRemove = async (shareId: string) => {
    setRemovingId(shareId);
    try {
      await removeShare(shareId);
    } catch (error) {
      useToastStore.getState().addToast(
        extractApiError(error, 'Não foi possível remover o acesso.'),
        'error',
      );
    } finally {
      setRemovingId(null);
    }
  };

  const handleTogglePublic = async () => {
    try {
      const result = await setPublic(!publ);
      setPubl(result.isPublic);
      setToken(result.publicToken);
    } catch (error) {
      useToastStore.getState().addToast(
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
      useToastStore.getState().addToast('Não foi possível copiar o link.', 'error');
    }
  };

  const toggleExpanded = (shareId: string) => {
    setExpandedShare((cur) => (cur === shareId ? null : shareId));
  };

  const saveScope = async (shareId: string) => {
    try {
      const leafIds = currentScopeIds(shareId);
      await setShareScope({ shareId, leafIds });
      setDraftScope((prev) => {
        const next = { ...prev };
        delete next[shareId];
        return next;
      });
      setExpandedShare(null);
      useToastStore.getState().addToast(
        leafIds.length
          ? 'Compartilhamento restrito às folhas selecionadas.'
          : 'Acesso total concedido ao caderno.',
        'success',
      );
    } catch (error) {
      useToastStore.getState().addToast(
        extractApiError(error, 'Não foi possível salvar a configuração.'),
        'error',
      );
    } finally {
      setSavingScope(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-heading font-bold text-slate-800 dark:text-dark-100 m-0">
          Compartilhar caderno
        </h2>
        <p className="text-sm text-slate-500 dark:text-dark-400 mt-1">
          Escolha quem pode acessar este caderno e quais folhas estarão disponíveis para cada pessoa.
        </p>
      </div>

      {/* Acesso público */}
      <div className="flex flex-col gap-3 rounded-2xl p-4" style={{ background: 'var(--bg-surface-hover)' }}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <Globe className="h-5 w-5 text-brand-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-dark-50">
                Link público
              </p>
              <p className="text-xs text-slate-500 dark:text-dark-400 mt-0.5">
                Qualquer pessoa com o link pode visualizar, sem precisar de login.
              </p>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={publ}
            onClick={handleTogglePublic}
            disabled={isSettingPublic}
            className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer flex-shrink-0 ${
              publ ? 'bg-brand-500' : 'bg-slate-300 dark:bg-dark-700'
            }`}
            title={publ ? 'Desativar link público' : 'Ativar link público'}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                publ ? 'translate-x-[22px]' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>

        {publ && token && (
          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700 truncate text-xs text-slate-500 dark:text-dark-400">
              {buildPublicUrl('notebook', notebookId, token)}
            </div>
            <Button variant="outline" size="sm" onClick={handleCopyLink}>
              <Link2 className="h-4 w-4" />
              {isLinkCopied ? 'Copiado!' : 'Copiar'}
            </Button>
          </div>
        )}
      </div>

      {/* Adicionar pessoa */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-slate-400" />
          <p className="text-sm font-semibold text-slate-800 dark:text-dark-50">
            Pessoas com acesso
          </p>
        </div>

        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              placeholder="E-mail do usuário..."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAdd();
                }
              }}
              error={emailError}
            />
          </div>
          <Button onClick={handleAdd} disabled={isCreating} className="flex-shrink-0">
            {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Adicionar'}
          </Button>
        </div>

        <div className="flex flex-col gap-2">
          {isLoadingShares ? (
            <div className="py-4 flex justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
            </div>
          ) : shares.length === 0 ? (
            <p className="text-xs text-slate-400 dark:text-dark-500 py-2">
              Nenhuma pessoa com acesso até o momento.
            </p>
          ) : (
            shares.map((share) => {
              const scoped = isScoped(share.id);
              const scopeSize = currentScopeIds(share.id).length;
              const isExpanded = expandedShare === share.id;
              return (
                <div
                  key={share.id}
                  className="flex flex-col rounded-2xl px-3 py-2"
                  style={{ background: 'var(--bg-surface-hover)' }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => toggleExpanded(share.id)}
                      className="flex items-center gap-3 min-w-0 flex-1 text-left cursor-pointer group"
                      title="Configurar acesso"
                    >
                      <div className="w-8 h-8 rounded-full bg-brand-500/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-brand-500">
                          {share.user.name
                            .split(' ')
                            .map((p) => p[0])
                            .slice(0, 2)
                            .join('')
                            .toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 dark:text-dark-50 truncate">
                          {share.user.name}
                        </p>
                        <p className="text-xs text-slate-400 dark:text-dark-500 truncate">
                          {share.user.email}
                          {' • '}
                          {scoped
                            ? `${scopeSize} ${scopeSize === 1 ? 'folha' : 'folhas'}`
                            : 'todas as folhas'}
                        </p>
                      </div>
                    </button>
                    <div className="flex items-center gap-0.5 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => toggleExpanded(share.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-brand-500 hover:bg-[var(--bg-surface-active)] transition-all cursor-pointer"
                        title={isExpanded ? 'Fechar configurações' : 'Configurar folhas'}
                        aria-label={`Configurar folhas de ${share.user.name}`}
                      >
                        <ChevronDown
                          className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemove(share.id)}
                        disabled={isRemoving && removingId === share.id}
                        className="p-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all cursor-pointer"
                        title="Remover acesso"
                        aria-label={`Remover acesso de ${share.user.name}`}
                      >
                        {isRemoving && removingId === share.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <UserX className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-3 pl-11 flex flex-col gap-3 border-t border-[var(--border-color)] pt-3">
                      <div className="flex flex-col gap-2">
                        <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-dark-200 cursor-pointer">
                          <button
                            type="button"
                            onClick={() => setFullAccess(share.id)}
                            disabled={isSettingScope}
                            className={`relative w-9 h-5 rounded-full transition-colors cursor-pointer flex-shrink-0 ${
                              !scoped ? 'bg-brand-500' : 'bg-slate-300 dark:bg-dark-700'
                            }`}
                          >
                            <span
                              className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                                !scoped ? 'translate-x-[18px]' : 'translate-x-0.5'
                              }`}
                            />
                          </button>
                          <span className="font-medium">Acesso a todas as folhas</span>
                        </label>

                        <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-dark-200 cursor-pointer">
                          <button
                            type="button"
                            onClick={() => setScoped(share.id)}
                            disabled={isSettingScope}
                            className={`relative w-9 h-5 rounded-full transition-colors cursor-pointer flex-shrink-0 ${
                              scoped ? 'bg-brand-500' : 'bg-slate-300 dark:bg-dark-700'
                            }`}
                          >
                            <span
                              className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                                scoped ? 'translate-x-[18px]' : 'translate-x-0.5'
                              }`}
                            />
                          </button>
                          <span className="font-medium">Apenas folhas selecionadas</span>
                        </label>
                      </div>

                      {scoped && (
                        <div className="flex flex-col gap-1 max-h-64 overflow-y-auto pr-1">
                          {flatLeaves.length === 0 ? (
                            <p className="text-xs text-slate-400 dark:text-dark-500">
                              Este caderno ainda não possui folhas.
                            </p>
                          ) : (
                            flatLeaves.map((leaf) => {
                              const selected = currentScopeIds(share.id).includes(leaf.id);
                              return (
                                <div
                                  key={leaf.id}
                                  style={{ paddingLeft: `${leaf.depth * 14}px` }}
                                >
                                  <button
                                    type="button"
                                    onClick={() => toggleLeaf(share.id, leaf.id)}
                                    className="flex items-center gap-2 text-left px-1 py-1.5 rounded-lg w-full hover:bg-[var(--bg-surface-active)] transition-colors cursor-pointer"
                                  >
                                    <span
                                      className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 transition-colors ${
                                        selected
                                          ? 'bg-brand-500 border-brand-500'
                                          : 'border-slate-300 dark:border-dark-600'
                                      }`}
                                    >
                                      {selected && <Check className="h-3.5 w-3.5 text-white" />}
                                    </span>
                                    <FileText className="h-4 w-4 text-slate-400 flex-shrink-0" />
                                    <span
                                      className={`text-sm truncate ${selected ? 'text-slate-800 dark:text-dark-50 font-medium' : 'text-slate-500 dark:text-dark-400'}`}
                                    >
                                      {leaf.title}
                                    </span>
                                  </button>
                                </div>
                              );
                            })
                          )}
                        </div>
                      )}

                      <div className="flex justify-end">
                        <Button
                          size="sm"
                          onClick={() => saveScope(share.id)}
                          disabled={isSettingScope || savingScope}
                        >
                          {isSettingScope || savingScope ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : null}
                          Salvar configuração
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default NotebookShareSettings;
