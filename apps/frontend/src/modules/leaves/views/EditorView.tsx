
import { useState, useCallback } from "react";
import { useParams, useNavigate, Link as RouterLink } from "react-router-dom";
import { EditorContent } from "@tiptap/react";
import { useLeaf } from "../hooks/useLeaves";
import { useLeafFlashcards, useUpdateFlashcard, useDeleteFlashcard } from "../../study/hooks/useFlashcards";
import type { Flashcard } from "../../study/types";
import type { Leaf } from "../types";
import { useQueryClient } from "@tanstack/react-query";
import { useToggleBookmark } from "../../bookmarks/hooks/useToggleBookmark";
import { useSoftDeleteLeaf } from "../../trash/hooks/useTrash";
import { useEditorStatusStore } from "../../../store/editorStatusStore";
import { useEditorContent } from "../hooks/useEditorContent";
import { useEditorActions } from "../hooks/useEditorActions";
import { EditorToolbar } from "../components/EditorToolbar";
import { EditorBubbleMenu } from "../components/EditorBubbleMenu";
import { AISidebar } from "../components/AISidebar";
import { EditorSkeleton } from "../components/EditorSkeleton";
import { EditorHeader } from "../components/EditorHeader";
import { SubLeavesSection } from "../components/SubLeavesSection";
import { ManualFlashcardModal } from "../components/ManualFlashcardModal";
import { ManualSummaryModal } from "../components/ManualSummaryModal";
import { EditFlashcardModal } from "../../notebooks/components/EditFlashcardModal"
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog.tsx";
import { useToastStore } from "../../../store/toastStore";
import { extractApiError } from "../../../utils/api-errors";
import leafService from "../services/leafService";

export const EditorView: React.FC = () => {
  const { notebookId, leafId } = useParams<{
    notebookId: string;
    leafId: string;
  }>();
  const navigate = useNavigate();

  const {
    leaf,
    isFetching: isFetchingLeaf,
    updateLeaf,
    generateAISummary,
    isGeneratingSummary,
    generateAIFlashcards,
    isGeneratingFlashcards,
    archiveLeaf,
    unarchiveLeaf,
  } = useLeaf(leafId || "");

  const { data: flashcards = [] } = useLeafFlashcards(leafId || "");

  // ── Flashcard Edit/Delete ──
  const [editingFlashcard, setEditingFlashcard] = useState<Flashcard | null>(null);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [isEditFlashcardModalOpen, setIsEditFlashcardModalOpen] = useState(false);
  const updateFlashcardMutation = useUpdateFlashcard(notebookId || undefined, leafId || undefined);
  const deleteFlashcardMutation = useDeleteFlashcard(notebookId || undefined, leafId || undefined);
  const { isBookmarked, toggleBookmark } = useToggleBookmark({
    type: "leaf",
    id: leafId || "",
    title: leaf?.title || "",
    path: `/notebooks/${notebookId}/leaves/${leafId}`,
  });
  const softDeleteLeaf = useSoftDeleteLeaf();
  const queryClient = useQueryClient();

  // ── Excluir Resumo ──
  const [confirmDeleteSummaryOpen, setConfirmDeleteSummaryOpen] = useState(false);
  const [isDeletingSummary, setIsDeletingSummary] = useState(false);

  const handleDeleteSummaryConfirm = useCallback(async () => {
    if (!leafId) return;
    setIsDeletingSummary(true);
    setConfirmDeleteSummaryOpen(false);
    try {
      const updated = await leafService.updateLeaf(leafId, { summary: null });
      queryClient.setQueryData<Leaf>(['leaves', leafId], (old) => {
        if (!old) return updated as unknown as Leaf;
        return { ...old, summary: null };
      });
      queryClient.setQueryData<{ summary?: string }>(
        ['leaves', leafId, 'summary'],
        { summary: undefined },
      );
      useToastStore.getState().addToast('Resumo excluído com sucesso.', 'success');
    } catch (err) {
      useToastStore.getState().addToast(
        extractApiError(err, 'Erro ao excluir resumo.'),
        'error',
      );
    } finally {
      setIsDeletingSummary(false);
    }
  }, [leafId, queryClient]);

  const handleDeleteSummaryClick = useCallback(() => {
    setConfirmDeleteSummaryOpen(true);
  }, []);
  const editorStatus = useEditorStatusStore();

  const isArchived = leaf?.archivedAt != null;

  // ── Hook: Editor + Autosave ──
  const {
    editor,
    localTitle,
    setLocalTitle,
    contentReady,
  } = useEditorContent({
    leaf,
    leafId: leafId || "",
    updateLeaf,
    editorStatus,
  });

  // ── Hook: Ações (archive, delete, AI, anotações, UI) ──
  const {
    aiSidebarOpen,
    setAiSidebarOpen,
    editorExpanded,
    handleExpandToggle,
    handleArchiveToggle,
    confirmDeleteOpen,
    setConfirmDeleteOpen,
    handleDeleteConfirm,
    isFlashcardModalOpen,
    setIsFlashcardModalOpen,
    handleGenerateSummary,
    handleGenerateFlashcards,
    annotationTrigger,
  } = useEditorActions({
    leafId: leafId || "",
    notebookId,
    navigate,
    queryClient,
    isArchived,
    archiveLeaf,
    unarchiveLeaf,
    softDeleteLeaf,
    generateAISummary,
    generateAIFlashcards,
    editor,
  });

  // ── Renderização Condicional ──
  if (!leaf && isFetchingLeaf) {
    return <EditorSkeleton />;
  }

  if (leaf && !contentReady) {
    return null;
  }

  if (!leaf) {
    return (
      <div className="text-center p-8">
        <h3 className="text-lg font-bold">Folha de anotação não encontrada</h3>
        <RouterLink
          to={`/notebooks/${notebookId}`}
          className="text-brand-500 hover:underline"
        >
          Voltar para o caderno
        </RouterLink>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Top Header */}
      <EditorHeader
        leafId={leafId || ""}
        isBookmarked={isBookmarked}
        isArchived={isArchived}
        aiSidebarOpen={aiSidebarOpen}
        editorExpanded={editorExpanded}
        onToggleBookmark={toggleBookmark}
        onArchiveToggle={handleArchiveToggle}
        onDelete={() => setConfirmDeleteOpen(true)}
        onToggleAiSidebar={() => setAiSidebarOpen(!aiSidebarOpen)}
        onToggleExpand={handleExpandToggle}
      />

      {/* Split Pane Editor / IA */}
      <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-[750px] lg:min-h-[90vh] min-w-0 overflow-hidden">
        {/* Lado Esquerdo - Editor */}
        <div
          className={`flex-1 flex flex-col bg-white dark:bg-dark-900 border border-slate-100 dark:border-dark-800 rounded-3xl p-6 min-w-0 overflow-hidden ${editorExpanded ? "lg:w-full" : ""}`}
        >
          <input
            type="text"
            value={localTitle}
            onChange={(e) => {
              setLocalTitle(e.target.value);
              editorStatus.setSaveStatus("saving");
            }}
            placeholder="Título da folha..."
            className="editor-title-input"
          />

          <EditorToolbar
            editor={editor}
            annotationTrigger={annotationTrigger}
          />

          <div className="tiptap-editor flex-1 overflow-x-hidden overflow-y-auto text-slate-750 dark:text-dark-100 relative min-h-[400px] min-w-0 w-full max-w-full pb-1.5">
            <EditorBubbleMenu editor={editor} />
            <EditorContent
              editor={editor}
              className="tiptap-content w-full h-full"
              style={{
                maxWidth: "100%",
                overflowWrap: "break-word",
                wordBreak: "break-word",
                whiteSpace: "pre-wrap",
                boxSizing: "border-box",
              }}
            />
          </div>
        </div>

        {/* Lado Direito - Painel de IA */}
        {aiSidebarOpen && !editorExpanded && (
          <AISidebar
            editor={editor}
            summary={leaf?.summary}
            flashcards={flashcards}
            notebookId={notebookId || ""}
            isGeneratingSummary={isGeneratingSummary}
            isGeneratingFlashcards={isGeneratingFlashcards}
            onCreateManualFlashcard={() => setIsFlashcardModalOpen(true)}
            onCreateManualSummary={() => setIsSummaryModalOpen(true)}
            onGenerateSummary={handleGenerateSummary}
            onGenerateFlashcards={handleGenerateFlashcards}
            onEditFlashcard={(card) => {
              setEditingFlashcard(card);
              setIsEditFlashcardModalOpen(true);
            }}
            onDeleteFlashcard={(cardId) => deleteFlashcardMutation.mutateAsync(cardId)}
            isDeletingFlashcard={deleteFlashcardMutation.isPending}
            isDeletingSummary={isDeletingSummary}
            onDeleteSummary={handleDeleteSummaryClick}
          />
        )}
      </div>

      {/* Sub-folhas com drag & drop */}
      {!editorExpanded && leaf && (
        <SubLeavesSection
          leaf={leaf}
          notebookId={notebookId || ""}
          leafId={leafId || ""}
        />
      )}

      {/* Modal: Editar Flashcard */}
      <EditFlashcardModal
        isOpen={isEditFlashcardModalOpen}
        onClose={() => {
          setIsEditFlashcardModalOpen(false);
          setEditingFlashcard(null);
        }}
        flashcard={editingFlashcard}
        onSave={async (cardId, data) => {
          await updateFlashcardMutation.mutateAsync({ cardId, data });
          setIsEditFlashcardModalOpen(false);
          setEditingFlashcard(null);
        }}
        onDelete={async (cardId) => {
          await deleteFlashcardMutation.mutateAsync(cardId);
          setIsEditFlashcardModalOpen(false);
          setEditingFlashcard(null);
        }}
        isSaving={updateFlashcardMutation.isPending}
        isDeleting={deleteFlashcardMutation.isPending}
      />

      {/* Modal: Criar/Editar Resumo Manual */}
      <ManualSummaryModal
        isOpen={isSummaryModalOpen}
        onClose={() => setIsSummaryModalOpen(false)}
        leafId={leafId || ""}
        currentSummary={leaf?.summary}
      />

      {/* Modal: Criar Flashcard Manual */}
      <ManualFlashcardModal
        isOpen={isFlashcardModalOpen}
        onClose={() => setIsFlashcardModalOpen(false)}
        leafId={leafId || ""}
        notebookId={notebookId || ""}
      />

      {/* Confirmar exclusão do resumo */}
      <ConfirmDialog
        isOpen={confirmDeleteSummaryOpen}
        onClose={() => setConfirmDeleteSummaryOpen(false)}
        onConfirm={handleDeleteSummaryConfirm}
        title="Excluir resumo?"
        message="Tem certeza que deseja excluir este resumo? Esta ação não pode ser desfeita."
        confirmLabel="Sim, excluir"
        variant="danger"
      />

      {/* Confirmar exclusão da folha */}
      <ConfirmDialog
        isOpen={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Mover para lixeira?"
        message={`Mover "${leaf?.title}" para a lixeira?`}
        confirmLabel="Mover para Lixeira"
        variant="danger"
      />
    </div>
  );
};


