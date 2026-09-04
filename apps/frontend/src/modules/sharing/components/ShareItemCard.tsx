import React from 'react';
import { Loader2, ChevronDown, UserX } from 'lucide-react';
import { ShareScopeEditor } from './ShareScopeEditor';
import type { Share } from '../types';
import type { FlatLeaf } from '../utils/flattenLeaves';

interface ShareItemCardProps {
  share: Share;
  flatLeaves: FlatLeaf[];
  selectedLeafIds: string[];
  isExpanded: boolean;
  isSettingScope: boolean;
  savingScope: boolean;
  isUpdatingPermission: boolean;
  removing: boolean;
  onToggleExpand: () => void;
  onRemove: () => void;
  onTogglePermission: () => void;
  onSetFullAccess: () => void;
  onSetScoped: () => void;
  onToggleLeaf: (leafId: string) => void;
  onSaveScope: () => void;
}

export const ShareItemCard: React.FC<ShareItemCardProps> = ({
  share,
  flatLeaves,
  selectedLeafIds,
  isExpanded,
  isSettingScope,
  savingScope,
  isUpdatingPermission,
  removing,
  onToggleExpand,
  onRemove,
  onTogglePermission,
  onSetFullAccess,
  onSetScoped,
  onToggleLeaf,
  onSaveScope,
}) => {
  const scoped = selectedLeafIds.length > 0;
  const scopeSize = selectedLeafIds.length;

  return (
    <div
      className="flex flex-col rounded-2xl px-3 py-2"
      style={{ background: 'var(--bg-surface-hover)' }}
    >
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onToggleExpand}
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
            onClick={onToggleExpand}
            className="p-1.5 rounded-lg text-slate-400 hover:text-brand-500 hover:bg-[var(--bg-surface-active)] transition-all cursor-pointer"
            title={isExpanded ? 'Fechar configurações' : 'Configurar folhas'}
            aria-label={`Configurar folhas de ${share.user.name}`}
          >
            <ChevronDown
              className={`h-4 w-4 transition-transform ${
                isExpanded ? 'rotate-180' : ''
              }`}
            />
          </button>
          <button
            type="button"
            onClick={onRemove}
            disabled={removing}
            className="p-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all cursor-pointer"
            title="Remover acesso"
            aria-label={`Remover acesso de ${share.user.name}`}
          >
            {removing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <UserX className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {isExpanded && (
        <ShareScopeEditor
          permission={share.permission}
          flatLeaves={flatLeaves}
          selectedLeafIds={selectedLeafIds}
          isSettingScope={isSettingScope}
          savingScope={savingScope}
          isUpdatingPermission={isUpdatingPermission}
          onSetFullAccess={onSetFullAccess}
          onSetScoped={onSetScoped}
          onTogglePermission={onTogglePermission}
          onToggleLeaf={onToggleLeaf}
          onSaveScope={onSaveScope}
        />
      )}
    </div>
  );
};

export default ShareItemCard;