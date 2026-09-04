import React from 'react';
import { Globe, Link2 } from 'lucide-react';
import { Button } from '../../../components/ui/Button.tsx';
import { buildPublicUrl } from '../types';

interface SharePublicCardProps {
  notebookId: string;
  publ: boolean;
  token: string | null;
  isLinkCopied: boolean;
  isSettingPublic: boolean;
  onTogglePublic: () => void;
  onCopyLink: () => void;
}

export const SharePublicCard: React.FC<SharePublicCardProps> = ({
  notebookId,
  publ,
  token,
  isLinkCopied,
  isSettingPublic,
  onTogglePublic,
  onCopyLink,
}) => {
  return (
    <div
      className="flex flex-col gap-3 rounded-2xl p-4"
      style={{ background: 'var(--bg-surface-hover)' }}
    >
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
          onClick={onTogglePublic}
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
          <Button variant="outline" size="sm" onClick={onCopyLink}>
            <Link2 className="h-4 w-4" />
            {isLinkCopied ? 'Copiado!' : 'Copiar'}
          </Button>
        </div>
      )}
    </div>
  );
};

export default SharePublicCard;