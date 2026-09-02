import React, { useState } from 'react';
import { Globe, Link2, Mail, UserX, Loader2 } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal.tsx';
import { Button } from '../../../components/ui/Button.tsx';
import { Input } from '../../../components/ui/Input.tsx';
import { useShares } from '../hooks/useSharing';
import { useToastStore } from '../../../store/toastStore';
import { extractApiError } from '../../../utils/api-errors';
import { buildPublicUrl, RESOURCE_TYPE_LABELS } from '../types';
import type { ShareResourceType } from '../types';

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
  const { shares, isLoadingShares, createShare, isCreating, removeShare, isRemoving, setPublic, isSettingPublic } =
    useShares(resourceType, resourceId);
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string>();
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [publicToken, setPublicToken] = useState<string | null>(initialToken);
  const [isLinkCopied, setIsLinkCopied] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

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
              ))
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ShareModal;