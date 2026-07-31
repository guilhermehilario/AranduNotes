import React, { useState, useMemo } from 'react';
import { ClipboardList, Search, X } from 'lucide-react';
import { useClipboardStore } from '../../../store/clipboardStore.ts';
import { ClipboardItemRow } from './ClipboardItemRow.tsx';

interface ClipboardManagerProps {
  show: boolean;
  onClose: () => void;
  /** Quando true, renderiza sem backdrop e sem posicionamento absoluto (para ser embutido em um dropdown combinado). */
  embedded?: boolean;
}

export const ClipboardManager: React.FC<ClipboardManagerProps> = ({
  show,
  onClose,
  embedded = false,
}) => {
  const items = useClipboardStore((s) => s.items);
  const clearAll = useClipboardStore((s) => s.clearAll);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const query = searchQuery.toLowerCase();
    return items.filter((item) => item.text.toLowerCase().includes(query));
  }, [items, searchQuery]);

  if (!show) return null;

  return (
    <>
      {/* Backdrop */}
      {!embedded && <div className="fixed inset-0 z-40" onClick={onClose} />}
      <div
        className={
          embedded
            ? 'w-full'
            : 'absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-2xl shadow-xl z-50 overflow-hidden animate-in slide-in-from-top-2 fade-in duration-200'
        }
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ borderBottom: '1px solid var(--border-color)' }}
        >
          <div className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4" style={{ color: 'var(--primary)' }} />
            <h4 className="text-sm font-heading font-bold" style={{ color: 'var(--text-primary)' }}>
              Histórico de cópia
            </h4>
          </div>
          <div className="flex items-center gap-1">
            {items.length > 0 && (
              <button
                type="button"
                onClick={clearAll}
                className="text-xs font-semibold px-2 py-1 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer"
                style={{ color: 'var(--text-secondary)' }}
              >
                Limpar
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-[var(--bg-surface-hover)] transition-colors cursor-pointer"
              style={{ color: 'var(--text-secondary)' }}
              title="Fechar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Search */}
        {items.length > 0 && (
          <div className="px-4 py-2" style={{ borderBottom: '1px solid var(--border-color)' }}>
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none"
                style={{ color: 'var(--text-secondary)' }}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Pesquisar no histórico..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg focus:outline-none transition-colors"
                style={{
                  background: 'var(--bg-surface-hover)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--border-active)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--border-color)';
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded-md hover:bg-[var(--bg-surface-active)] transition-colors cursor-pointer"
                  style={{ color: 'var(--text-secondary)' }}
                  title="Limpar busca"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Body */}
        <div className={embedded ? 'overflow-y-auto' : 'max-h-80 overflow-y-auto'}>
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
              <ClipboardList className="h-8 w-8 mb-2" style={{ color: 'var(--text-secondary)' }} />
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                Histórico vazio
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                Copie textos para vê-los aqui
              </p>
              {!embedded && (
                <p
                  className="text-[10px] mt-2 px-3 py-1 rounded-lg"
                  style={{ background: 'var(--bg-surface-hover)', color: 'var(--text-secondary)' }}
                >
                  Atalho: Ctrl+Shift+V
                </p>
              )}
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
              <Search className="h-8 w-8 mb-2" style={{ color: 'var(--text-secondary)' }} />
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                Nenhum resultado encontrado
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                Tente outros termos de busca
              </p>
            </div>
          ) : (
            <div className="flex flex-col">
              {filteredItems.map((item) => (
                <ClipboardItemRow
                  key={item.id}
                  item={item}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div
            className="px-4 py-2.5"
            style={{
              background: 'var(--bg-surface-hover)',
              borderTop: '1px solid var(--border-color)',
            }}
          >
            <p className="text-[11px] text-center" style={{ color: 'var(--text-secondary)' }}>
              Clique para colar · Arraste para campos de texto · {filteredItems.length} de {items.length} item{items.length !== 1 ? 'ns' : ''}
            </p>
          </div>
        )}
      </div>
    </>
  );
};

export default ClipboardManager;
