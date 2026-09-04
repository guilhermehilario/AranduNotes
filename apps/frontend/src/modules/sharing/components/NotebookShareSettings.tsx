import React, { useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { useShares } from '../hooks/useSharing';
import { useShareInvite } from '../hooks/useShareInvite';
import { useSharePublic } from '../hooks/useSharePublic';
import { useShareActions } from '../hooks/useShareActions';
import { useShareScope } from '../hooks/useShareScope';
import { flattenLeaves } from '../utils/flattenLeaves';
import { SharePublicCard } from './SharePublicCard';
import { AddSharePerson } from './AddSharePerson';
import { ShareItemCard } from './ShareItemCard';
import type { Leaf } from '../../leaves/types';

interface NotebookShareSettingsProps {
  notebookId: string;
  isPublic?: boolean;
  publicToken?: string | null;
  leaves: Leaf[];
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

  const { email, setEmail, emailError, handleAdd } = useShareInvite({
    createShare,
  });

  const {
    publ,
    token,
    isLinkCopied,
    handleTogglePublic,
    handleCopyLink,
  } = useSharePublic({
    notebookId,
    isPublic,
    publicToken,
    setPublic,
  });

  const { removingId, handleRemove, handleChangePermission } = useShareActions({
    shares,
    removeShare,
    updatePermission,
  });

  const {
    currentScopeIds,
    expandedShare,
    toggleExpanded,
    toggleLeaf,
    setFullAccess,
    setScoped,
    saveScope,
    savingScope,
  } = useShareScope({ shares, flatLeaves, setShareScope });

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
      <SharePublicCard
        notebookId={notebookId}
        publ={publ}
        token={token}
        isLinkCopied={isLinkCopied}
        isSettingPublic={isSettingPublic}
        onTogglePublic={handleTogglePublic}
        onCopyLink={handleCopyLink}
      />

      {/* Adicionar pessoa */}
      <div className="flex flex-col gap-3">
        <AddSharePerson
          email={email}
          emailError={emailError}
          isCreating={isCreating}
          onEmailChange={setEmail}
          onAdd={handleAdd}
        />

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
              const selectedLeafIds = currentScopeIds(share.id);
              return (
                <ShareItemCard
                  key={share.id}
                  share={share}
                  flatLeaves={flatLeaves}
                  selectedLeafIds={selectedLeafIds}
                  isExpanded={expandedShare === share.id}
                  isSettingScope={isSettingScope}
                  savingScope={savingScope}
                  isUpdatingPermission={isUpdatingPermission}
                  removing={isRemoving && removingId === share.id}
                  onToggleExpand={() => toggleExpanded(share.id)}
                  onRemove={() => handleRemove(share.id)}
                  onTogglePermission={() => handleChangePermission(share.id)}
                  onSetFullAccess={() => setFullAccess(share.id)}
                  onSetScoped={() => setScoped(share.id)}
                  onToggleLeaf={(leafId) => toggleLeaf(share.id, leafId)}
                  onSaveScope={() => saveScope(share.id)}
                />
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default NotebookShareSettings;