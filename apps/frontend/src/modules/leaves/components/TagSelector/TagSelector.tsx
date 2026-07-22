import React, { useState } from 'react';
import { useTags, useCreateTag, useLeafTags, useAddTagToLeaf, useRemoveTagFromLeaf } from '../../../tags/hooks/useTags';
import { ChevronDown, Plus, X, Tag as TagIcon, Loader2 } from 'lucide-react';
import { TAG_COLORS_ARRAY, DEFAULT_TAG_COLOR, getTagColor } from '../../../tags/constants';
import { useToastStore } from '../../../../store/toastStore';
import { extractApiError } from '../../../../utils/api-errors';
import type { Tag } from '../../../tags/types';

interface TagSelectorProps {
  leafId: string;
}

export const TagSelector: React.FC<TagSelectorProps> = ({ leafId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [selectedColor, setSelectedColor] = useState(DEFAULT_TAG_COLOR);

  const { data: tags = [] } = useTags();
  const { data: leafTags = [], isLoading: loadingLeafTags } = useLeafTags(leafId);
  const addTagToLeaf = useAddTagToLeaf();
  const removeTagFromLeaf = useRemoveTagFromLeaf();
  const createTag = useCreateTag();

  const handleToggleTag = async (tagId: string) => {
    const isActive = leafTags.some((t: Tag) => t.id === tagId);
    if (isActive) {
      await removeTagFromLeaf.mutateAsync({ leafId, tagId });
    } else {
      await addTagToLeaf.mutateAsync({ leafId, tagId });
    }
  };

  const handleCreateAndAdd = async () => {
    if (!newTagName.trim()) return;
    try {
      const newTag = await createTag.mutateAsync({ name: newTagName.trim(), color: selectedColor });
      await addTagToLeaf.mutateAsync({ leafId, tagId: newTag.id });
      setNewTagName('');
    } catch (err) {
      useToastStore.getState().addToast(extractApiError(err, 'Erro ao criar tag.'), 'error');
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-dark-300 hover:text-brand-500 transition-colors py-1 px-2 rounded-lg hover:bg-slate-100 dark:hover:bg-dark-800"
      >
        <TagIcon className="h-3.5 w-3.5" />
        Tags
        <ChevronDown className={`h-3 w-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 z-50 w-72 bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700 rounded-2xl shadow-xl p-4">
          <p className="text-xs font-bold text-slate-400 dark:text-dark-400 mb-3 uppercase tracking-wide">
            Tags
          </p>

          {loadingLeafTags ? (
            <div className="flex justify-center py-3">
              <Loader2 className="h-4 w-4 animate-spin text-brand-500" />
            </div>
          ) : (
            <div className="flex flex-wrap gap-1.5 mb-3 max-h-32 overflow-y-auto">
              {tags.map((tag: Tag) => {
                const isActive = leafTags.some((t: Tag) => t.id === tag.id);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => handleToggleTag(tag.id)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all border cursor-pointer ${
                      isActive
                        ? 'text-white border-transparent shadow-sm'
                        : 'text-slate-500 dark:text-dark-300 border-slate-200 dark:border-dark-700 hover:border-slate-300'
                    }`}
                    style={{
                      backgroundColor: isActive ? getTagColor(tag.color, tag.name) : 'transparent',
                    }}
                  >
                    {isActive && <X className="h-3 w-3" />}
                    {tag.name}
                  </button>
                );
              })}
            </div>
          )}

          {/* Create new tag */}
          <div className="border-t border-slate-100 dark:border-dark-800 pt-3">
            <p className="text-xs font-bold text-slate-400 dark:text-dark-400 mb-2">Nova Tag</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="Nome da tag..."
                className="flex-1 px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-lg text-slate-900 dark:text-dark-50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-100 dark:focus:ring-brand-900/20"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateAndAdd();
                }}
              />
              <button
                type="button"
                onClick={handleCreateAndAdd}
                disabled={!newTagName.trim() || createTag.isPending}
                className="px-2.5 py-1.5 bg-brand-500 text-white text-xs font-semibold rounded-lg hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="flex gap-1.5 mt-2">
              {TAG_COLORS_ARRAY.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={`w-5 h-5 rounded-full border-2 transition-transform ${
                    selectedColor === color ? 'border-slate-800 dark:border-white scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TagSelector;
