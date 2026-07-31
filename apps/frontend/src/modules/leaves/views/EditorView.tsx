import { useEffect, useState } from "react";
import { useParams, useNavigate, Link as RouterLink } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useLeaf } from "../hooks/useLeaves";
import { useLeafFlashcards } from "../../study/hooks/useFlashcards";
import { useToggleBookmark } from "../../bookmarks/hooks/useToggleBookmark";
import { useSoftDeleteLeaf } from "../../trash/hooks/useTrash";
import { useEditorStatusStore } from "../../../store/editorStatusStore";
import { useEditorContent } from "../hooks/useEditorContent";
import { useEditorActions } from "../hooks/useEditorActions";
import { useFlashcardOperations } from "../hooks/useFlashcardOperations";
import { EditorSkeleton } from "../components/EditorSkeleton";
import { EditorHeader } from "../components/EditorHeader";
import { EditorContentArea } from "../components/EditorContentArea";
import { AISidebar } from "../components/AISidebar";
import { SubLeavesSection } from "../components/SubLeavesSection";
import { EditorModals } from "../components/EditorModals";

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
  const editorStatus = useEditorStatusStore();
  const isArchived = leaf?.archivedAt != null;

  // ── Hooks extraídos ──
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

  const queryClient = useQueryClient();

  const {
    aiSidebarOpen,
    setAiSidebarOpen,
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
    softDeleteLeaf,
    isArchived,
    archiveLeaf,
    unarchiveLeaf,
    generateAISummary,
    generateAIFlashcards,
    editor,
  });

  // ── Dica mobile: painel de IA abre por ~1s na entrada e fecha sozinho ──
  // No mobile o painel de IA começa aberto (estado inicial); após 1s ele fecha
  // e o botão "PA" do header pulsa para indicar onde reabrir.
  const [aiButtonHint, setAiButtonHint] = useState(false);

  // ── Fade de saída suave: mantém o painel de IA montado durante os 300ms
  // da transição de ocultação (opacidade/deslocamento), desmontando só depois.
  // O estado só é alterado via timers (respeitando react-hooks/set-state-in-effect):
  // ao fechar, agenda a ocultação para 300ms depois; ao reabrir, agenda a
  // exibição para o próximo frame (permite o fade-in de entrada normalmente).
  const [aiPanelHidden, setAiPanelHidden] = useState(false);

  useEffect(() => {
    if (aiSidebarOpen) {
      const t = setTimeout(() => setAiPanelHidden(false), 0);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setAiPanelHidden(true), 300);
    return () => clearTimeout(t);
  }, [aiSidebarOpen]);

  useEffect(() => {
    const isMobile = window.matchMedia("(max-width: 1023.98px)").matches;
    if (!isMobile) return;

    setAiSidebarOpen(true);
    const closeTimer = setTimeout(() => {
      setAiSidebarOpen(false);
      setAiButtonHint(true);
    }, 1000);
    const hintTimer = setTimeout(() => setAiButtonHint(false), 5000);

    return () => {
      clearTimeout(closeTimer);
      clearTimeout(hintTimer);
    };
  }, [setAiSidebarOpen, setAiButtonHint]);

  const {
    editingFlashcard,
    setEditingFlashcard,
    isSummaryModalOpen,
    setIsSummaryModalOpen,
    isEditFlashcardModalOpen,
    setIsEditFlashcardModalOpen,
    confirmDeleteFlashcardId,
    handleDeleteFlashcardClick,
    handleDeleteFlashcardConfirm,
    handleCloseDeleteFlashcard,
    confirmDeleteSummaryOpen,
    isDeletingSummary,
    handleDeleteSummaryClick,
    handleDeleteSummaryConfirm,
    handleCloseDeleteSummary,
    updateFlashcardMutation,
    deleteFlashcardMutation,
  } = useFlashcardOperations({
    leafId: leafId || "",
    notebookId,
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
        aiButtonHint={aiButtonHint}
        onToggleBookmark={toggleBookmark}
        onArchiveToggle={handleArchiveToggle}
        onDelete={() => setConfirmDeleteOpen(true)}
        onToggleAiSidebar={() => setAiSidebarOpen(!aiSidebarOpen)}
      />

      {/* Split Pane Editor / IA — no mobile, quando o painel de IA está aberto ele
          "troca" com o editor (o texto fica oculto via max-lg:hidden); no desktop
          os dois ficam lado a lado */}
      <div className="relative flex-1 flex flex-col lg:flex-row gap-4 lg:gap-6 min-h-[250px] sm:min-h-[400px] lg:min-h-[90vh] min-w-0 overflow-hidden">
        {/* Lado Esquerdo - Editor */}
        <EditorContentArea
          editor={editor}
          localTitle={localTitle}
          setLocalTitle={setLocalTitle}
          setSaveStatus={editorStatus.setSaveStatus}
          annotationTrigger={annotationTrigger}
          className={aiSidebarOpen ? "max-lg:hidden" : ""}
        />

        {/* Lado Direito - Painel de IA */}
        {/* No mobile o painel vira um overlay absoluto; ao fechar ele desvanece
            (opacity + translate) revelando o editor por trás, e só então é
            desmontado — no desktop permanece em fluxo ao lado do editor e faz
            um fade puro no lugar. */}
        {!aiPanelHidden && (
          <AISidebar
            className={`max-lg:absolute max-lg:inset-0 max-lg:z-20 ${
              aiSidebarOpen
                ? ""
                : "opacity-0 max-lg:translate-y-2 pointer-events-none"
            }`}
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
            onDeleteFlashcard={handleDeleteFlashcardClick}
            isDeletingFlashcard={deleteFlashcardMutation.isPending}
            isDeletingSummary={isDeletingSummary}
            onDeleteSummary={handleDeleteSummaryClick}
          />
        )}
      </div>

      {/* Sub-folhas com drag & drop */}
      {leaf && (
        <SubLeavesSection
          leaf={leaf}
          notebookId={notebookId || ""}
          leafId={leafId || ""}
        />
      )}

      {/* Modais */}
      <EditorModals
        isEditFlashcardModalOpen={isEditFlashcardModalOpen}
        onCloseEditFlashcard={() => {
          setIsEditFlashcardModalOpen(false);
          setEditingFlashcard(null);
        }}
        editingFlashcard={editingFlashcard}
        onSaveFlashcard={async (cardId, data) => {
          await updateFlashcardMutation.mutateAsync({ cardId, data });
          setIsEditFlashcardModalOpen(false);
          setEditingFlashcard(null);
        }}
        onDeleteFlashcardFromModal={async (cardId) => {
          await deleteFlashcardMutation.mutateAsync(cardId);
          setIsEditFlashcardModalOpen(false);
          setEditingFlashcard(null);
        }}
        isSavingFlashcard={updateFlashcardMutation.isPending}
        isDeletingFlashcard={deleteFlashcardMutation.isPending}
        isSummaryModalOpen={isSummaryModalOpen}
        onCloseSummary={() => setIsSummaryModalOpen(false)}
        leafId={leafId || ""}
        currentSummary={leaf?.summary}
        isFlashcardModalOpen={isFlashcardModalOpen}
        onCloseFlashcard={() => setIsFlashcardModalOpen(false)}
        notebookId={notebookId || ""}
        confirmDeleteFlashcardId={confirmDeleteFlashcardId}
        onCloseDeleteFlashcard={handleCloseDeleteFlashcard}
        onConfirmDeleteFlashcard={handleDeleteFlashcardConfirm}
        confirmDeleteSummaryOpen={confirmDeleteSummaryOpen}
        onCloseDeleteSummary={handleCloseDeleteSummary}
        onConfirmDeleteSummary={handleDeleteSummaryConfirm}
        confirmDeleteOpen={confirmDeleteOpen}
        onCloseDeleteLeaf={() => setConfirmDeleteOpen(false)}
        onConfirmDeleteLeaf={handleDeleteConfirm}
        leafTitle={leaf?.title || ""}
      />
    </div>
  );
};
