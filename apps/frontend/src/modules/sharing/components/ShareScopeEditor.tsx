import React from 'react';
import { Check, FileText, Loader2, Pencil } from 'lucide-react';
import { Button } from '../../../components/ui/Button.tsx';
import type { SharePermission } from '../types';
import type { FlatLeaf } from '../utils/flattenLeaves';

interface ShareScopeEditorProps {
  permission: SharePermission;
  flatLeaves: FlatLeaf[];
  selectedLeafIds: string[];
  isSettingScope: boolean;
  savingScope: boolean;
  isUpdatingPermission: boolean;
  onSetFullAccess: () => void;
  onSetScoped: () => void;
  onTogglePermission: () => void;
  onToggleLeaf: (leafId: string) => void;
  onSaveScope: () => void;
}

export const ShareScopeEditor: React.FC<ShareScopeEditorProps> = ({
  permission,
  flatLeaves,
  selectedLeafIds,
  isSettingScope,
  savingScope,
  isUpdatingPermission,
  onSetFullAccess,
  onSetScoped,
  onTogglePermission,
  onToggleLeaf,
  onSaveScope,
}) => {
  const scoped = selectedLeafIds.length > 0;

  return (
    <div className="mt-3 pl-11 flex flex-col gap-3 border-t border-[var(--border-color)] pt-3">
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={onSetFullAccess}
          disabled={isSettingScope}
          className="flex items-center gap-2 text-sm text-slate-700 dark:text-dark-200 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <span
            className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ${
              !scoped ? 'bg-brand-500' : 'bg-slate-300 dark:bg-dark-700'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                !scoped ? 'translate-x-[14px]' : 'translate-x-0'
              }`}
            />
          </span>
          <span className="font-medium">Acesso a todas as folhas</span>
        </button>

        <button
          type="button"
          onClick={onSetScoped}
          disabled={isSettingScope}
          className="flex items-center gap-2 text-sm text-slate-700 dark:text-dark-200 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <span
            className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ${
              scoped ? 'bg-brand-500' : 'bg-slate-300 dark:bg-dark-700'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                scoped ? 'translate-x-[14px]' : 'translate-x-0'
              }`}
            />
          </span>
          <span className="font-medium">Apenas folhas selecionadas</span>
        </button>

        <button
          type="button"
          role="switch"
          aria-checked={permission === 'editor'}
          onClick={onTogglePermission}
          disabled={isUpdatingPermission}
          className="flex items-center gap-2 text-sm text-slate-700 dark:text-dark-200 cursor-pointer pt-1 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <span
            className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ${
              permission === 'editor' ? 'bg-brand-500' : 'bg-slate-300 dark:bg-dark-700'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                permission === 'editor' ? 'translate-x-[14px]' : 'translate-x-0'
              }`}
            />
          </span>
          <Pencil className="h-4 w-4 text-slate-400 flex-shrink-0" />
          <span className="font-medium">Permitir edição</span>
        </button>
      </div>

      {scoped && (
        <div className="flex flex-col gap-1 max-h-64 overflow-y-auto pr-1">
          {flatLeaves.length === 0 ? (
            <p className="text-xs text-slate-400 dark:text-dark-500">
              Este caderno ainda não possui folhas.
            </p>
          ) : (
            flatLeaves.map((leaf) => {
              const selected = selectedLeafIds.includes(leaf.id);
              return (
                <div key={leaf.id} style={{ paddingLeft: `${leaf.depth * 14}px` }}>
                  <button
                    type="button"
                    onClick={() => onToggleLeaf(leaf.id)}
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
                      className={`text-sm truncate ${
                        selected
                          ? 'text-slate-800 dark:text-dark-50 font-medium'
                          : 'text-slate-500 dark:text-dark-400'
                      }`}
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
          onClick={onSaveScope}
          disabled={isSettingScope || savingScope}
        >
          {isSettingScope || savingScope ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : null}
          Salvar configuração
        </Button>
      </div>
    </div>
  );
};

export default ShareScopeEditor;