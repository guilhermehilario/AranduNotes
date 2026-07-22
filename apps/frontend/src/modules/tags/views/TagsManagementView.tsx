import React, { useState } from 'react';
import { useTags, useCreateTag, useUpdateTag, useDeleteTag } from '../hooks/useTags';
import { Plus, Edit2, Trash2, Loader2, TagIcon } from 'lucide-react';
import { PageContainer } from '../../../components/ui/PageContainer.tsx';
import { Card } from '../../../components/ui/Card.tsx';
import { Button } from '../../../components/ui/Button.tsx';
import { Modal } from '../../../components/ui/Modal.tsx';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog.tsx';
import { TAG_COLORS_ARRAY, DEFAULT_TAG_COLOR } from '../constants';
import { useToastStore } from '../../../store/toastStore';
import { extractApiError } from '../../../utils/api-errors';
import type { Tag } from '../types';

export const TagsManagementView: React.FC = () => {
  const { data: tags = [], isLoading } = useTags();
  const createTag = useCreateTag();
  const updateTag = useUpdateTag();
  const deleteTag = useDeleteTag();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(DEFAULT_TAG_COLOR);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      await createTag.mutateAsync({ name: newName.trim(), color: newColor });
      setNewName('');
      setNewColor(DEFAULT_TAG_COLOR);
      setIsCreateOpen(false);
    } catch (err) {
      useToastStore.getState().addToast(extractApiError(err, 'Erro ao criar tag.'), 'error');
    }
  };

  const handleUpdate = async () => {
    if (!editingTag) return;
    try {
      await updateTag.mutateAsync({
        id: editingTag.id,
        data: { name: newName.trim(), color: newColor },
      });
      setIsEditOpen(false);
      setEditingTag(null);
    } catch (err) {
      useToastStore.getState().addToast(extractApiError(err, 'Erro ao atualizar tag.'), 'error');
    }
  };

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleDeleteConfirm = async () => {
    if (!confirmDeleteId) return;
    try {
      await deleteTag.mutateAsync(confirmDeleteId);
      setConfirmDeleteId(null);
    } catch (err) {
      useToastStore.getState().addToast(extractApiError(err, 'Erro ao excluir tag.'), 'error');
    }
  };

  if (isLoading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <PageContainer>
      <div className="flex justify-between items-center">
        <p className="text-slate-500 dark:text-dark-350">
          Crie, edite e exclua tags para classificar suas folhas de anotação
        </p>
        <Button
          onClick={() => {
            setNewName('');
            setNewColor(DEFAULT_TAG_COLOR);
            setIsCreateOpen(true);
          }}
          leftIcon={<Plus className="h-4 w-4" />}
        >
          Nova Tag
        </Button>
      </div>

      {tags.length === 0 ? (
        <Card className="flex flex-col items-center justify-center text-center p-12 min-h-[30vh] border border-dashed border-slate-200 dark:border-dark-800">
          <div className="w-14 h-14 rounded-2xl bg-brand-50 dark:bg-brand-950/20 flex items-center justify-center text-brand-500 mb-4">
            <TagIcon className="h-7 w-7" />
          </div>
          <h3 className="text-md font-heading font-bold text-slate-850 dark:text-dark-100">
            Nenhuma tag criada
          </h3>
          <p className="text-sm text-slate-500 dark:text-dark-350 mt-1 max-w-sm">
            Crie tags para organizar suas folhas por categorias como Importante, Prova, Exercícios, etc.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tags.map((tag: Tag) => (
            <Card
              key={tag.id}
              className="flex items-center justify-between p-4 border border-slate-100 dark:border-dark-800"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-4 h-4 rounded-full flex-shrink-0"
                  style={{ backgroundColor: tag.color }}
                />
                <span className="font-semibold text-slate-800 dark:text-dark-100 truncate min-w-0">{tag.name}</span>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setEditingTag(tag);
                    setNewName(tag.name);
                    setNewColor(tag.color);
                    setIsEditOpen(true);
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-brand-500 hover:bg-slate-100 dark:hover:bg-dark-800 transition-colors cursor-pointer"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDeleteId(tag.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Criar Tag"
        footer={
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={!newName.trim() || createTag.isPending}>
              {createTag.isPending ? 'Criando...' : 'Criar Tag'}
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-dark-200">Nome da Tag</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Ex: Trabalho, Aula, Resumo..."
              className="w-full px-3.5 py-2.5 bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700 rounded-xl text-slate-900 dark:text-dark-50 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-brand-100 dark:focus:ring-brand-900/20 focus:border-brand-500 transition-all duration-200"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-700 dark:text-dark-200">Cor</label>
            <div className="flex gap-3">
              {TAG_COLORS_ARRAY.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setNewColor(color)}
                  className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 cursor-pointer ${
                    newColor === color ? 'border-slate-800 dark:border-white scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Editar Tag"
        footer={
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdate} disabled={!newName.trim() || updateTag.isPending}>
              {updateTag.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-dark-200">Nome da Tag</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Ex: Trabalho..."
              className="w-full px-3.5 py-2.5 bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700 rounded-xl text-slate-900 dark:text-dark-50 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-brand-100 dark:focus:ring-brand-900/20 focus:border-brand-500 transition-all duration-200"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-700 dark:text-dark-200">Cor</label>
            <div className="flex gap-3">
              {TAG_COLORS_ARRAY.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setNewColor(color)}
                  className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 cursor-pointer ${
                    newColor === color ? 'border-slate-800 dark:border-white scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        </div>
      </Modal>

      {/* Confirmar exclusão */}
      <ConfirmDialog
        isOpen={confirmDeleteId !== null}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        title="Excluir tag?"
        message="Tem certeza que deseja excluir esta tag? Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        variant="danger"
      />
    </PageContainer>
  );
};

export default TagsManagementView;
