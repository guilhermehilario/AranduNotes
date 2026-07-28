import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { ClipboardList, Trash2, Pencil, Check, X, Copy, FileText, Star, Search } from 'lucide-react';
import { useClipboardStore, type ClipboardItem } from '../../../store/clipboardStore.ts';

function formatTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 10) return 'agora';
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes === 1) return '1 min';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours === 1) return '1 hora';
  if (hours < 24) return `${hours} horas`;
  const days = Math.floor(hours / 24);
  if (days === 1) return '1 dia';
  return `${days} dias`;
}

/**
 * Attempts to insert text into the currently focused input/textarea
 * at the cursor position, respecting maxLength. Returns true if successful.
 */
function insertIntoFocusedElement(text: string): boolean {
  const el = document.activeElement;
  if (!el) return false;

  // Check if the active element is an input, textarea, or contenteditable
  const isInput =
    el instanceof HTMLInputElement ||
    el instanceof HTMLTextAreaElement;
  const isContentEditable =
    (el instanceof HTMLElement && el.isContentEditable) ||
    el instanceof HTMLSelectElement;

  if (!isInput && !isContentEditable) return false;

  if (isInput) {
    const input = el as HTMLInputElement | HTMLTextAreaElement;

    // Respect maxLength
    const maxLength = input.maxLength;
    const start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? input.value.length;
    const currentLen = input.value.length;
    const selectedLen = end - start;
    const remaining = maxLength > -1 ? maxLength - (currentLen - selectedLen) : text.length;
    const trimmedText = remaining < text.length ? text.slice(0, remaining) : text;

    const before = input.value.slice(0, start);
    const after = input.value.slice(end);
    input.value = before + trimmedText + after;

    // Set cursor position after inserted text
    const newCursor = start + trimmedText.length;
    input.setSelectionRange(newCursor, newCursor);

    // Trigger input event so React/other listeners pick up the change
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.focus();
    return true;
  }

  // For contenteditable elements
  if (isContentEditable) {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return false;

    const range = selection.getRangeAt(0);
    range.deleteContents();
    range.insertNode(document.createTextNode(text));
    // Move cursor to end of inserted text
    range.setStartAfter(range.endContainer!);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
    return true;
  }

  return false;
}

interface ClipboardItemRowProps {
  item: ClipboardItem;
}

const ClipboardItemRow: React.FC<ClipboardItemRowProps> = ({ item }) => {
  const removeItem = useClipboardStore((s) => s.removeItem);
  const updateItem = useClipboardStore((s) => s.updateItem);
  const toggleFavorite = useClipboardStore((s) => s.toggleFavorite);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(item.text);
  const inputRef = useRef<HTMLInputElement>(null);
  const [justCopied, setJustCopied] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSaveEdit = useCallback(() => {
    const trimmed = editText.trim();
    if (trimmed && trimmed !== item.text) {
      updateItem(item.id, trimmed);
    }
    setIsEditing(false);
  }, [editText, item.id, item.text, updateItem]);

  const handleCancelEdit = useCallback(() => {
    setEditText(item.text);
    setIsEditing(false);
  }, [item.text]);

  const handleItemClick = useCallback(() => {
    const text = isEditing ? editText : item.text;
    const inserted = insertIntoFocusedElement(text);
    if (!inserted) {
      // No focused input — copy to native clipboard
      navigator.clipboard.writeText(text).then(() => {
        setJustCopied(true);
        setTimeout(() => setJustCopied(false), 1500);
      });
    }
  }, [isEditing, editText, item.text]);

  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      removeItem(item.id);
    },
    [item.id, removeItem]
  );

  const handleEdit = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setEditText(item.text);
      setIsEditing(true);
    },
    [item.text]
  );

  const handleFavorite = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      toggleFavorite(item.id);
    },
    [item.id, toggleFavorite]
  );

  const handleDragStart = useCallback(
    (e: React.DragEvent) => {
      e.dataTransfer.setData('text/plain', item.text);
      e.dataTransfer.effectAllowed = 'copy';
      setIsDragging(true);
    },
    [item.text]
  );

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  return (
    <div
      role="button"
      tabIndex={0}
      draggable={!isEditing}
      onClick={handleItemClick}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleItemClick();
        }
      }}
      className={`group relative flex items-start gap-2 px-4 py-3 text-left cursor-${isDragging ? 'grabbing' : 'grab'} hover:bg-[var(--bg-surface-hover)] transition-colors border-b border-[var(--border-color)] last:border-b-0 ${isDragging ? 'opacity-50' : ''}`}
    >
      {/* Favorite star — always visible */}
      <button
        type="button"
        onClick={handleFavorite}
        className="flex-shrink-0 mt-1 p-0.5 rounded-md transition-colors cursor-pointer"
        title={item.favorited ? 'Remover dos favoritos' : 'Favoritar'}
      >
        <Star
          className={`h-3.5 w-3.5 transition-all duration-200 ${
            item.favorited
              ? 'text-amber-400 fill-amber-400 drop-shadow-sm'
              : 'text-slate-400 dark:text-dark-500 hover:text-amber-400/50'
          }`}
        />
      </button>

      {/* Icon area */}
      <div className="flex-shrink-0 mt-1">
        {justCopied ? (
          <Copy className="h-3.5 w-3.5 text-brand-500" />
        ) : (
          <FileText className="h-3.5 w-3.5" style={{ color: 'var(--text-secondary)' }} />
        )}
      </div>

      {/* Content */}
      <div className="flex-grow min-w-0">
        {isEditing ? (
          <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
            <input
              ref={inputRef}
              type="text"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveEdit();
                if (e.key === 'Escape') handleCancelEdit();
              }}
              className="w-full px-2 py-1 rounded-lg text-sm focus:outline-none"
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-active)',
                color: 'var(--text-primary)',
              }}
            />
            <button
              type="button"
              onClick={handleSaveEdit}
              className="p-1 rounded-md hover:bg-brand-500/10 text-brand-500 transition-colors cursor-pointer flex-shrink-0"
              title="Salvar"
            >
              <Check className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={handleCancelEdit}
              className="p-1 rounded-md hover:bg-rose-500/10 text-rose-500 transition-colors cursor-pointer flex-shrink-0"
              title="Cancelar"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <>
            <p className="text-xs font-medium leading-relaxed line-clamp-2" style={{ color: 'var(--text-primary)' }}>
              {item.text}
            </p>
            <p className="text-[10px] mt-1" style={{ color: 'var(--text-secondary)' }}>
              {formatTimeAgo(item.createdAt)}
              {isDragging && (
                <span className="ml-2 text-brand-500 font-medium">Arraste para um campo de texto</span>
              )}
            </p>
          </>
        )}
      </div>

      {/* Actions — show on hover */}
      {!isEditing && (
        <div className="flex-shrink-0 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={handleEdit}
            className="p-1 rounded-md hover:bg-[var(--bg-surface-active)] transition-colors cursor-pointer"
            title="Editar"
            style={{ color: 'var(--text-secondary)' }}
          >
            <Pencil className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="p-1 rounded-md hover:bg-rose-500/10 text-rose-400 transition-colors cursor-pointer"
            title="Remover"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
};

interface ClipboardManagerProps {
  show: boolean;
  onClose: () => void;
}

export const ClipboardManager: React.FC<ClipboardManagerProps> = ({
  show,
  onClose,
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
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-2xl shadow-xl z-50 overflow-hidden animate-in slide-in-from-top-2 fade-in duration-200"
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
        <div className="max-h-80 overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
              <ClipboardList className="h-8 w-8 mb-2" style={{ color: 'var(--text-secondary)' }} />
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                Histórico vazio
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                Copie textos para vê-los aqui
              </p>
              <p className="text-[10px] mt-2 px-3 py-1 rounded-lg" style={{ background: 'var(--bg-surface-hover)', color: 'var(--text-secondary)' }}>
                Atalho: Ctrl+Shift+V
              </p>
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
