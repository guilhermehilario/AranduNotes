import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Trash2, Pencil, Check, X, Copy, FileText, Star } from 'lucide-react';
import { useClipboardStore, type ClipboardItem } from '../../../store/clipboardStore.ts';
import { insertIntoFocusedElement } from './clipboard-utils.ts';
import { formatTimeAgo } from '../../../utils/dateFormatUtils.ts';

interface ClipboardItemRowProps {
  item: ClipboardItem;
}

export const ClipboardItemRow: React.FC<ClipboardItemRowProps> = ({ item }) => {
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
    [item.id, removeItem],
  );

  const handleEdit = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setEditText(item.text);
      setIsEditing(true);
    },
    [item.text],
  );

  const handleFavorite = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      toggleFavorite(item.id);
    },
    [item.id, toggleFavorite],
  );

  const handleDragStart = useCallback(
    (e: React.DragEvent) => {
      e.dataTransfer.setData('text/plain', item.text);
      e.dataTransfer.effectAllowed = 'copy';
      setIsDragging(true);
    },
    [item.text],
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
      {/* Favorite star */}
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

      {/* Icon */}
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

      {/* Actions */}
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
