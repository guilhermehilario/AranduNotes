import React, { useCallback, useRef, useState } from 'react';
import { Globe, Link2, Mail, UserX, Loader2, Users, Pencil } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal.tsx';
import { Button } from '../../../components/ui/Button.tsx';
import { Input } from '../../../components/ui/Input.tsx';
import { useShares } from '../hooks/useSharing';
import { useToastStore } from '../../../store/toastStore';
import { extractApiError } from '../../../utils/api-errors';
import { buildPublicUrl, RESOURCE_TYPE_LABELS } from '../types';
import { friendsService } from '../../friends/services/friendsService';
import type { SearchResult } from '../../friends/types';
import type { ShareResourceType, SharePermission } from '../types';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  resourceType: ShareResourceType;
  resourceId: string;
  title: string;
  initialIsPublic?: boolean;
  initialToken?: string | null;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface PermissionPickerProps {
  value: SharePermission;
  onChange: (p: SharePermission) => void;
  disabled?: boolean;
  size?: 'sm' | 'md';
}

const PermissionPicker: React.FC<PermissionPickerProps> = ({
  value,
  onChange,
  disabled,
  size = 'md',
}) => {
  const isEditor = value === 'editor';
  const dim = size === 'sm' ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-1.5 text-sm';
  const base =
    'rounded-lg border font-medium inline-flex items-center gap-1.5 transition-all cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-brand-500/40 disabled:opacity-60 disabled:cursor-not-allowed';
  const tone = isEditor
    ? 'border-brand-500/70 bg-brand-500/15 text-brand-600 dark:text-brand-400'
    : 'border-slate-200 dark:border-dark-700 bg-white dark:bg-dark-900 text-slate-500 dark:text-dark-400 hover:text-slate-700 dark:hover:text-dark-200';
  return (
    <button
      type="button"
      role="switch"
      aria-checked={isEditor}
      disabled={disabled}
      onClick={() => onChange(isEditor ? 'viewer' : 'editor')}
      className={`${base} ${tone} ${dim}`}
      title={
        isEditor
          ? 'Esta pessoa pode editar. Clique para remover a edição.'
          : 'Esta pessoa só visualiza. Clique para permitir a edição.'
      }
      aria-label={
        isEditor ? 'Remover permissão de edição' : 'Permitir edição'
      }
    >
      <Pencil className={`h-3.5 w-3.5 ${isEditor ? '' : 'opacity-60'}`} />
      {isEditor ? 'Pode editar' : 'Permitir edição'}
    </button>
  );
};


export const ShareModal: React.FC<ShareModalProps> = (props) => {
  // `key` alterna a cada abertura/fechamento, remontando o conteúdo — o
  // estado interno (e-mail, público) sempre começa "fresco" sem usar effect.
  return <ShareModalContent key={props.isOpen ? 'open' : 'closed'} {...props} />;
};

const ShareModalContent: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  resourceType,
  resourceId,
  title,
  initialIsPublic = false,
  initialToken = null,
}) => {
  const { shares, isLoadingShares, createShare, isCreating, updatePermission, isUpdatingPermission, removeShare, isRemoving, setPublic, isSettingPublic } =
    useShares(resourceType, resourceId);
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string>();
  const [addPermission, setAddPermission] = useState<SharePermission>('viewer');
  const [permissionPendingId, setPermissionPendingId] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [publicToken, setPublicToken] = useState<string | null>(initialToken);
  const [isLinkCopied, setIsLinkCopied] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runSearch = useCallback(async (query: string) => {
    const q = query.trim();
    if (!q) {
      setSuggestions([]);
      setSuggestOpen(false);
      return;
    }
    setSearching(true);
    try {
      const results = await friendsService.searchUsers(q);
      const friends = results.filter((r) => r.relationship === 'friend');
      setSuggestions(friends);
      setSuggestOpen(friends.length > 0);
    } catch {
      setSuggestions([]);
      setSuggestOpen(false);
    } finally {
      setSearching(false);
    }
  }, []);

  const handleEmailChange = (value: string) => {
    setEmail(value);
    setEmailError(undefined);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => runSearch(value), 250);
  };

  const selectFriend = (friend: SearchResult) => {
    setEmail(friend.email);
    setSuggestOpen(false);
    setSuggestions([]);
    handleAddWith(friend.email);
  };

  const handleAddWith = async (emailValue: string) => {
    const value = emailValue.trim();
    if (!EMAIL_REGEX.test(value)) {
      setEmailError('Digite um e-mail válido.');
      return;
    }
    setEmailError(undefined);
    try {
      await createShare({ email: value, permission: addPermission });
      setEmail('');
      setSuggestions([]);
      setSuggestOpen(false);
      useToastStore.getState().addToast('Acesso compartilhado.', 'success');
    } catch (error) {
      useToastStore.getState().addToast(
        extractApiError(error, 'Não foi possível compartilhar.'),
        'error',
      );
    }
  };

  const handleAdd = () => handleAddWith(email);

  const handleChangePermission = async (shareId: string, permission: SharePermission) => {
    setPermissionPendingId(shareId);
    try {
      await updatePermission({ shareId, permission });
      useToastStore.getState().addToast('Permissão atualizada.', 'success');
    } catch (error) {
      useToastStore.getState().addToast(
        extractApiError(error, 'Não foi possível alterar a permissão.'),
        'error',
      );
    } finally {
      setPermissionPendingId(null);
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
      const result = await setPublic(!isPublic);
      setIsPublic(result.isPublic);
      setPublicToken(result.publicToken);
    } catch (error) {
      useToastStore.getState().addToast(
        extractApiError(error, 'Não foi possível alterar o acesso público.'),
        'error',
      );
    }
  };

  const handleCopyLink = async () => {
    if (!publicToken) return;
    const url = buildPublicUrl(resourceType, resourceId, publicToken);
    try {
      await navigator.clipboard.writeText(url);
      setIsLinkCopied(true);
      setTimeout(() => setIsLinkCopied(false), 2000);
    } catch {
      useToastStore.getState().addToast('Não foi possível copiar o link.', 'error');
    }
  };

  const typeLabel = RESOURCE_TYPE_LABELS[resourceType];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Compartilhar ${typeLabel.toLowerCase()}`}
    >
      <div className="flex flex-col gap-6">
        <p className="text-sm text-slate-500 dark:text-dark-400 line-clamp-2">
          {title}
        </p>

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
              aria-checked={isPublic}
              onClick={handleTogglePublic}
              disabled={isSettingPublic}
              className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer flex-shrink-0 ${
                isPublic ? 'bg-brand-500' : 'bg-slate-300 dark:bg-dark-700'
              }`}
              title={isPublic ? 'Desativar link público' : 'Ativar link público'}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  isPublic ? 'translate-x-[22px]' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {isPublic && publicToken && (
            <div className="flex items-center gap-2">
              <div className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700 truncate text-xs text-slate-500 dark:text-dark-400">
                {buildPublicUrl(resourceType, resourceId, publicToken)}
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

          <div className="flex gap-2 items-start">
            <div className="flex-1 relative">
              <Input
                placeholder="Nome ou e-mail (amigos sugeridos)..."
                value={email}
                onChange={(e) => handleEmailChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAdd();
                  }
                }}
                onBlur={() => setTimeout(() => setSuggestOpen(false), 150)}
                error={emailError}
              />
              {suggestOpen && (
                <div className="absolute z-20 left-0 right-0 top-full mt-1 rounded-xl border border-slate-200 dark:border-dark-700 bg-white dark:bg-dark-900 shadow-lg overflow-hidden">
                  {searching ? (
                    <div className="flex items-center justify-center gap-2 px-3 py-3 text-xs text-slate-400">
                      <Loader2 className="h-4 w-4 animate-spin" /> Buscando amigos...
                    </div>
                  ) : (
                    <ul className="max-h-56 overflow-y-auto">
                      {suggestions.map((s) => (
                        <li key={s.id}>
                          <button
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              selectFriend(s);
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors cursor-pointer"
                          >
                            <div
                              className="w-8 h-8 rounded-full bg-brand-500/10 flex items-center justify-center flex-shrink-0"
                            >
                              <span className="text-xs font-bold text-brand-500">
                                {s.name
                                  .split(' ')
                                  .map((p) => p[0])
                                  .slice(0, 2)
                                  .join('')
                                  .toUpperCase()}
                              </span>
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-slate-800 dark:text-dark-50 truncate">
                                {s.name}
                              </p>
                              <p className="text-xs text-slate-400 dark:text-dark-500 truncate">
                                {s.email}
                              </p>
                            </div>
                            <span className="ml-auto flex items-center gap-1 text-[10px] font-medium text-brand-500 flex-shrink-0">
                              <Users className="h-3 w-3" /> Amigo
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
            <PermissionPicker
              value={addPermission}
              onChange={setAddPermission}
            />
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
              shares.map((share) => (
                <div
                  key={share.id}
                  className="flex items-center justify-between gap-2 rounded-xl px-3 py-2"
                  style={{ background: 'var(--bg-surface-hover)' }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-8 h-8 rounded-full bg-brand-500/10 flex items-center justify-center flex-shrink-0"
                      
                    >
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
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <PermissionPicker
                      value={share.permission === 'editor' ? 'editor' : 'viewer'}
                      onChange={(p) => handleChangePermission(share.id, p)}
                      disabled={isUpdatingPermission && permissionPendingId === share.id}
                      size="sm"
                    />
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
              ))
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ShareModal;