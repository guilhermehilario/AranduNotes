import { useParams, Link } from "react-router-dom";
import { Plus, FileText, Loader2 } from "lucide-react";
import { useNotebookData } from "../hooks/useNotebookData";
import { useNotebookActions } from "../hooks/useNotebookActions";
import { useNotebookLeafCreation } from "../hooks/useNotebookLeafCreation";
import { PageContainer } from "../../../components/ui/PageContainer.tsx";
import { Button } from "../../../components/ui/Button.tsx";
import { EmptyState } from "../../../components/ui/EmptyState.tsx";
import { LeafCard } from "../components/LeafCard";
import { NotebookHeader } from "../components/NotebookHeader";
import { FlashcardsSection } from "../components/FlashcardsSection";
import { CreateLeafModal } from "../components/CreateLeafModal";
import { CreateFlashcardModal } from "../components/CreateFlashcardModal";
import { EditNotebookModal } from "../components/EditNotebookModal";
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog.tsx";

export const NotebookView: React.FC = () => {
  const { notebookId } = useParams<{ notebookId: string }>();

  // ── Data fetching centralizado ──
  const {
    navigate,
    notebook,
    isLoading,
    updateNotebook,
    leaves,
    createLeaf,
    flashcards,
    isLoadingFlashcards,
    isBookmarked,
    toggleBookmark,
    softDeleteNotebook,
  } = useNotebookData({ notebookId: notebookId || "" });

  // ── Hook: Ações do notebook (editar, excluir, flashcards) ──
  const {
    isEditModalOpen,
    setIsEditModalOpen,
    selectedColor,
    setSelectedColor,
    isFlashcardModalOpen,
    setIsFlashcardModalOpen,
    selectedLeafId,
    setSelectedLeafId,
    actionError,
    confirmDeleteOpen,
    setConfirmDeleteOpen,
    registerEdit,
    handleSubmitEdit,
    editErrors,
    registerFc,
    handleSubmitFc,
    fcErrors,
    resetFc,
    createFlashcardMutation,
    handleOpenEditModal,
    onEditSubmit,
    handleDeleteNotebookConfirm,
    onFlashcardSubmit,
  } = useNotebookActions({
    notebookId: notebookId || "",
    notebook,
    navigate,
    updateNotebook,
    softDeleteNotebook,
  });

  // ── Hook: Criação de folhas ──
  const {
    isModalOpen,
    setIsModalOpen,
    parentLeafId,
    setParentLeafId,
    register,
    handleSubmit,
    errors,
    onSubmit,
    handleCloseModal,
  } = useNotebookLeafCreation({
    notebookId: notebookId || "",
    createLeaf,
  });

  // ── Loading state ──
  if (isLoading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-brand-500" />
      </div>
    );
  }

  if (!notebook) {
    return (
      <div className="text-center p-8">
        <h3 className="text-lg font-bold">Caderno não encontrado</h3>
        <Link
          to="/dashboard"
          className="text-brand-500 hover:underline mt-2 inline-block"
        >
          Voltar para o Dashboard
        </Link>
      </div>
    );
  }

  return (
    <PageContainer>
      {/* Cabeçalho */}
      <NotebookHeader
        notebook={notebook}
        isBookmarked={isBookmarked}
        onToggleBookmark={toggleBookmark}
        onOpenEditModal={handleOpenEditModal}
        onDelete={() => setConfirmDeleteOpen(true)}
      />

      {/* Listagem de Folhas */}
      <div className="flex flex-col gap-4 mt-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-heading font-bold text-slate-800 dark:text-dark-100 m-0">
            Folhas de Anotação ({leaves.length})
          </h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setParentLeafId(undefined);
                setIsModalOpen(true);
              }}
              leftIcon={<Plus className="h-4 w-4" />}
            >
              Nova Folha
            </Button>
          </div>
        </div>

        {leaves.length === 0 ? (
          <EmptyState
            icon={<FileText className="h-7 w-7" />}
            title="Nenhuma folha criada neste caderno"
            description="Crie folhas para anotar os conteúdos de suas aulas e gerar materiais de estudo por IA."
            action={
              <Button
                variant="ghost"
                onClick={() => {
                  setParentLeafId(undefined);
                  setIsModalOpen(true);
                }}
                leftIcon={<Plus className="h-4 w-4" />}
                className="mt-4 text-brand-500"
              >
                Criar primeira folha
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {leaves.map((leaf) => (
              <LeafCard
                key={leaf.id}
                leaf={leaf}
                notebookId={notebookId || ""}
                onCreateSubLeaf={() => {
                  setParentLeafId(leaf.id);
                  setIsModalOpen(true);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Flashcards */}
      <FlashcardsSection
        flashcards={flashcards}
        isLoading={isLoadingFlashcards}
        onOpenCreateModal={() => {
          if (leaves.length > 0) setSelectedLeafId(leaves[0].id);
          setIsFlashcardModalOpen(true);
        }}
      />

      {/* Modal: Criar Folha */}
      <CreateLeafModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmit(onSubmit)}
        register={register}
        errors={errors}
        parentLeafId={parentLeafId}
        setParentLeafId={setParentLeafId}
        leaves={leaves}
      />

      {/* Modal: Criar Flashcard */}
      <CreateFlashcardModal
        isOpen={isFlashcardModalOpen}
        onClose={() => {
          setIsFlashcardModalOpen(false);
          resetFc();
        }}
        leaves={leaves}
        selectedLeafId={selectedLeafId}
        setSelectedLeafId={setSelectedLeafId}
        registerFc={registerFc}
        handleSubmitFc={handleSubmitFc}
        fcErrors={fcErrors}
        onFlashcardSubmit={onFlashcardSubmit}
        isPending={createFlashcardMutation.isPending}
      />

      {/* Modal: Editar Caderno */}
      <EditNotebookModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleSubmitEdit(onEditSubmit)}
        register={registerEdit}
        errors={editErrors}
        selectedColor={selectedColor}
        setSelectedColor={setSelectedColor}
        actionError={actionError}
      />

      {/* Confirmar exclusão */}
      <ConfirmDialog
        isOpen={confirmDeleteOpen}
        onClose={() => {
          setConfirmDeleteOpen(false);
        }}
        onConfirm={handleDeleteNotebookConfirm}
        title="Excluir Caderno?"
        message="Tem certeza que deseja mover este caderno para a lixeira? Todas as folhas e flashcards associados também serão movidos."
        confirmLabel="Sim, Mover para Lixeira"
        cancelLabel="Cancelar"
        variant="danger"
      />

      {actionError && !isEditModalOpen && !confirmDeleteOpen && (
        <div className="p-3 rounded-xl text-sm font-medium bg-rose-50 text-rose-600 border border-rose-100 dark:bg-rose-950/20 dark:text-rose-400 animate-in fade-in slide-in-from-top-2 duration-200">
          {actionError}
        </div>
      )}
    </PageContainer>
  );
};
