import React from "react";
import type { Flashcard } from "../../study/types";
import { EditFlashcardModal } from "../../notebooks/components/EditFlashcardModal";
import { ManualSummaryModal } from "./ManualSummaryModal";
import { ManualFlashcardModal } from "./ManualFlashcardModal";
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog";

interface EditorModalsProps {
  /** Edit Flashcard Modal */
  isEditFlashcardModalOpen: boolean;
  onCloseEditFlashcard: () => void;
  editingFlashcard: Flashcard | null;
  onSaveFlashcard: (cardId: string, data: { front?: string; back?: string }) => Promise<void>;
  onDeleteFlashcardFromModal: (cardId: string) => Promise<void>;
  isSavingFlashcard: boolean;
  isDeletingFlashcard: boolean;
  /** Manual Summary Modal */
  isSummaryModalOpen: boolean;
  onCloseSummary: () => void;
  leafId: string;
  currentSummary: string | undefined | null;
  /** Manual Flashcard Modal */
  isFlashcardModalOpen: boolean;
  onCloseFlashcard: () => void;
  notebookId: string;
  /** Flashcard delete confirmation */
  confirmDeleteFlashcardId: string | null;
  onCloseDeleteFlashcard: () => void;
  onConfirmDeleteFlashcard: () => void;
  /** Summary delete confirmation */
  confirmDeleteSummaryOpen: boolean;
  onCloseDeleteSummary: () => void;
  onConfirmDeleteSummary: () => void;
  /** Leaf delete confirmation */
  confirmDeleteOpen: boolean;
  onCloseDeleteLeaf: () => void;
  onConfirmDeleteLeaf: () => void;
  leafTitle: string;
}

export const EditorModals: React.FC<EditorModalsProps> = ({
  isEditFlashcardModalOpen,
  onCloseEditFlashcard,
  editingFlashcard,
  onSaveFlashcard,
  onDeleteFlashcardFromModal,
  isSavingFlashcard,
  isDeletingFlashcard,
  isSummaryModalOpen,
  onCloseSummary,
  leafId,
  currentSummary,
  isFlashcardModalOpen,
  onCloseFlashcard,
  notebookId,
  confirmDeleteFlashcardId,
  onCloseDeleteFlashcard,
  onConfirmDeleteFlashcard,
  confirmDeleteSummaryOpen,
  onCloseDeleteSummary,
  onConfirmDeleteSummary,
  confirmDeleteOpen,
  onCloseDeleteLeaf,
  onConfirmDeleteLeaf,
  leafTitle,
}) => {
  return (
    <>
      <EditFlashcardModal
        isOpen={isEditFlashcardModalOpen}
        onClose={onCloseEditFlashcard}
        flashcard={editingFlashcard}
        onSave={onSaveFlashcard}
        onDelete={onDeleteFlashcardFromModal}
        isSaving={isSavingFlashcard}
        isDeleting={isDeletingFlashcard}
      />

      <ManualSummaryModal
        isOpen={isSummaryModalOpen}
        onClose={onCloseSummary}
        leafId={leafId}
        currentSummary={currentSummary}
      />

      <ManualFlashcardModal
        isOpen={isFlashcardModalOpen}
        onClose={onCloseFlashcard}
        leafId={leafId}
        notebookId={notebookId}
      />

      <ConfirmDialog
        isOpen={!!confirmDeleteFlashcardId}
        onClose={onCloseDeleteFlashcard}
        onConfirm={onConfirmDeleteFlashcard}
        title="Excluir flashcard?"
        message="Tem certeza que deseja excluir este flashcard? Ele será movido para a lixeira."
        confirmLabel="Sim, excluir"
        variant="danger"
      />

      <ConfirmDialog
        isOpen={confirmDeleteSummaryOpen}
        onClose={onCloseDeleteSummary}
        onConfirm={onConfirmDeleteSummary}
        title="Excluir resumo?"
        message="Tem certeza que deseja excluir este resumo? Esta ação não pode ser desfeita."
        confirmLabel="Sim, excluir"
        variant="danger"
      />

      <ConfirmDialog
        isOpen={confirmDeleteOpen}
        onClose={onCloseDeleteLeaf}
        onConfirm={onConfirmDeleteLeaf}
        title="Mover para lixeira?"
        message={`Mover "${leafTitle}" para a lixeira?`}
        confirmLabel="Mover para Lixeira"
        variant="danger"
      />
    </>
  );
};

export default EditorModals;
