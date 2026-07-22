import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  ChevronDown,
  ChevronRight,
  FileText,
  Calendar,
  GripVertical,
  Plus,
} from 'lucide-react';
import { useToastStore } from '../../../store/toastStore';
import { extractApiError } from '../../../utils/api-errors';
import leafService from '../services/leafService';
import type { Leaf } from '../types';

interface SubLeafCardProps {
  subLeaf: Leaf;
  onNavigate: (id: string) => void;
}

const SortableSubLeafCard: React.FC<SubLeafCardProps> = ({
  subLeaf,
  onNavigate,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: subLeaf.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : ('auto' as const),
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="min-w-0 rounded-2xl bg-white dark:bg-dark-900 border border-slate-100 dark:border-dark-800 hover:border-brand-200 dark:hover:border-brand-900/40 hover:shadow-md transition-all overflow-hidden"
    >
      <div className="flex items-stretch">
        {/* Área de drag handle */}
        <button
          type="button"
          className="flex items-center justify-center w-8 min-h-full bg-slate-50 dark:bg-dark-950/30 hover:bg-slate-100 dark:hover:bg-dark-800 text-slate-400 hover:text-slate-600 dark:hover:text-dark-300 transition-colors cursor-grab active:cursor-grabbing flex-shrink-0"
          {...attributes}
          {...listeners}
          title="Arrastar para reordenar"
        >
          <GripVertical className="h-4 w-4" />
        </button>

        {/* Conteúdo do card */}
        <button
          type="button"
          onClick={() => onNavigate(subLeaf.id)}
          className="flex-1 p-3 text-left cursor-pointer"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-dark-800 flex items-center justify-center text-slate-500 dark:text-dark-300 flex-shrink-0">
              <FileText className="h-3.5 w-3.5" />
            </div>
            <h4 className="font-heading font-semibold text-sm truncate text-slate-800 dark:text-dark-50">
              {subLeaf.title}
            </h4>
          </div>
          <p className="text-[10px] text-slate-400 dark:text-dark-400 flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {new Date(subLeaf.updatedAt).toLocaleDateString('pt-BR')}
          </p>
          <div className="mt-1.5 flex items-center gap-1 text-[10px] font-semibold text-brand-500">
            Abrir <ChevronRight className="h-3 w-3" />
          </div>
        </button>
      </div>
    </div>
  );
};

interface SubLeavesSectionProps {
  leaf: Leaf;
  notebookId: string;
  leafId: string;
}

export const SubLeavesSection: React.FC<SubLeavesSectionProps> = ({
  leaf,
  notebookId,
  leafId,
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [subLeavesOpen, setSubLeavesOpen] = useState(false);
  const [creatingSubLeaf, setCreatingSubLeaf] = useState(false);
  /** Guarda o estado anterior das sub-folhas para rollback em caso de erro */
  const prevChildrenRef = useRef<Leaf[] | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const subLeaves = useMemo(() => (leaf?.children as Leaf[]) ?? [], [leaf]);

  const reorderMutation = useMutation({
    mutationFn: (orderedIds: string[]) =>
      leafService.reorderLeaves(orderedIds, leafId),

    // ⚡ No erro: reverte o cache otimista para o estado anterior
    onError: () => {
      if (prevChildrenRef.current) {
        const fallbackLeaf = { ...leaf, children: prevChildrenRef.current };
        queryClient.setQueryData<Leaf[]>(
          ['notebooks', notebookId, 'leaves'],
          (old: Leaf[] | undefined) =>
            old?.map((l: Leaf) =>
              l.id === leafId
                ? { ...l, children: prevChildrenRef.current! }
                : l,
            ) ?? old,
        );
        queryClient.setQueryData<Leaf>(
          ['leaves', leafId],
          () => fallbackLeaf as Leaf,
        );
      }
    },

    // ✅ No sucesso: apenas invalida a lista do caderno para sincronizar
    //    (o queryKey individual ['leaves', leafId] já foi atualizado
    //     otimistamente e NÃO deve ser sobrescrito por um refetch)
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['notebooks', notebookId, 'leaves'],
        refetchType: 'active',
      });
    },
  });

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = subLeaves.findIndex((l) => l.id === active.id);
      const newIndex = subLeaves.findIndex((l) => l.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      // Salva estado anterior para rollback
      prevChildrenRef.current = [...subLeaves];

      const reordered = arrayMove(subLeaves, oldIndex, newIndex);

      // ⚡ Update OTimista: atualiza caches imediatamente
      const updatedLeaf = { ...leaf, children: reordered };

      queryClient.setQueryData<Leaf[]>(
        ['notebooks', notebookId, 'leaves'],
        (old: Leaf[] | undefined) =>
          old?.map((l: Leaf) =>
            l.id === leafId ? { ...l, children: reordered } : l,
          ) ?? old,
      );

      queryClient.setQueryData<Leaf>(['leaves', leafId], () => updatedLeaf as Leaf);

      // Envia a requisição ao backend
      reorderMutation.mutate(reordered.map((l) => l.id));
    },
    [subLeaves, leaf, notebookId, leafId, queryClient, reorderMutation],
  );

  const handleCreateSubLeaf = useCallback(async () => {
    if (creatingSubLeaf) return;
    setCreatingSubLeaf(true);
    try {
      const newLeaf = await leafService.createLeaf(notebookId, {
        title: 'Nova sub-folha',
        content: '',
        rawText: '',
        parentId: leafId,
      });

      // ⚡ Adiciona a nova sub-folha ao cache da folha pai para
      //    que apareça imediatamente sem precisar recarregar.
      queryClient.setQueryData<Leaf>(["leaves", leafId], (old: Leaf | undefined) => {
        if (!old) return old;
        const children = old.children ?? [];
        const alreadyExists = children.some((c: Leaf) => c.id === newLeaf.id);
        if (alreadyExists) return old;
        return {
          ...old,
          children: [
            ...children,
            { ...newLeaf, children: [], tags: [] } as Leaf,
          ],
        };
      });

      // ⚡ Também adiciona à lista da sidebar para que o contador
      //    de folhas no NotebookView reflita a nova sub-folha.
      queryClient.setQueryData<Leaf[]>(
        ["notebooks", notebookId, "leaves"],
        (old: Leaf[] | undefined) => {
          if (!old) return old;
          const alreadyExists = old.some((l: Leaf) => l.id === newLeaf.id);
          if (alreadyExists) return old;
          return [...old, { ...newLeaf, children: [], tags: [] } as Leaf];
        },
      );

      navigate(`/notebooks/${notebookId}/leaves/${newLeaf.id}`);
    } catch (err) {
      useToastStore.getState().addToast(
        extractApiError(err, 'Erro ao criar sub-folha.'),
        'error',
      );
    } finally {
      setCreatingSubLeaf(false);
    }
  }, [notebookId, leafId, navigate, queryClient, creatingSubLeaf]);

  return (
    <div className="flex-shrink-0 border-t border-slate-100 dark:border-dark-800/60 pt-3 mt-1">
      <div className="flex items-center gap-2 pb-2">
        <button
          type="button"
          onClick={() => setSubLeavesOpen(!subLeavesOpen)}
          className="flex items-center gap-2 flex-1 text-left cursor-pointer group"
        >
          <FileText className="h-4 w-4 text-slate-400 group-hover:text-brand-500 transition-colors" />
          <h3 className="text-sm font-heading font-bold text-slate-500 dark:text-dark-400 group-hover:text-slate-700 dark:group-hover:text-dark-200 transition-colors">
            Sub-folhas ({subLeaves.length})
          </h3>
          {subLeaves.length > 0 && (
            <div
              className="transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
              style={{
                transform: subLeavesOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
              }}
            >
              <ChevronDown className="h-4 w-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
            </div>
          )}
        </button>

        <button
          type="button"
          onClick={handleCreateSubLeaf}
          disabled={creatingSubLeaf}
          className="flex items-center gap-1 text-xs font-semibold text-brand-500 hover:text-brand-600 dark:hover:text-brand-400 transition-colors py-1 px-2 rounded-lg hover:bg-brand-50 dark:hover:bg-brand-900/20 cursor-pointer disabled:opacity-50"
          title="Criar sub-folha"
        >
          <Plus className="h-3.5 w-3.5" />
          Nova
        </button>
      </div>

      <div
        className="grid transition-[grid-template-rows] duration-300 ease-out"
        style={{
          gridTemplateRows:
            subLeaves.length > 0 && subLeavesOpen ? '1fr' : '0fr',
        }}
      >
        <div className="overflow-hidden min-h-0">
          {subLeaves.length > 0 ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={subLeaves.map((l) => l.id)}
                strategy={rectSortingStrategy}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pb-2 max-h-[30vh] overflow-y-auto">
                  {subLeaves.map((subLeaf) => (
                    <SortableSubLeafCard
                      key={subLeaf.id}
                      subLeaf={subLeaf}
                      onNavigate={(id) =>
                        navigate(`/notebooks/${notebookId}/leaves/${id}`)
                      }
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          ) : (
            <p className="text-xs text-slate-400 dark:text-dark-400 pb-2">
              Nenhuma sub-folha ainda. Clique em "Nova" acima para criar uma.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubLeavesSection;
