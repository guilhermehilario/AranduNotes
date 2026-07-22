
import { useParams, useNavigate, Link as RouterLink } from "react-router-dom";
import { EditorContent } from "@tiptap/react";
import { useLeaf } from "../hooks/useLeaves";
import { useLeafFlashcards } from "../../study/hooks/useFlashcards";
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
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog.tsx";

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
  const { isBookmarked, toggleBookmark } = useToggleBookmark({
    type: "leaf",
    id: leafId || "",
    title: leaf?.title || "",
    path: `/notebooks/${notebookId}/leaves/${leafId}`,
  });
  const softDeleteLeaf = useSoftDeleteLeaf();
  const queryClient = useQueryClient();
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
      <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-[750px] lg:min-h-[90vh] overflow-hidden">
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
            onGenerateSummary={handleGenerateSummary}
            onGenerateFlashcards={handleGenerateFlashcards}
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

      {/* Modal: Criar Flashcard Manual */}
      <ManualFlashcardModal
        isOpen={isFlashcardModalOpen}
        onClose={() => setIsFlashcardModalOpen(false)}
        leafId={leafId || ""}
        notebookId={notebookId || ""}
      />

      {/* Confirmar exclusão */}
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


