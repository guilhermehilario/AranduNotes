import { useState, memo, useId, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import type { Editor } from "@tiptap/react";
import {
  Sparkles,
  HelpCircle,
  Play,
  Plus,
  Upload,
  Pencil,
  Trash2,
  FileText,
  Image as ImageIcon,
  Music,
  File,
  Loader2,
  X,
} from "lucide-react";
import { AnnotationSidebar } from "./AnnotationSidebar";
import { Card } from "../../../components/ui/Card.tsx";
import { Button } from "../../../components/ui/Button.tsx";
import { EmptyState } from "../../../components/ui/EmptyState.tsx";
import { useAttachments } from "../hooks/useAttachments";
import type { Flashcard } from "../../study/types";

interface AISidebarProps {
  editor: Editor | null;
  summary: string | null | undefined;
  flashcards: Flashcard[];
  leafId: string;
  notebookId: string;
  /** Permissão para criar/editar resumo e flashcards */
  canEdit?: boolean;
  /** Permissão para enviar arquivos */
  canUploadFiles?: boolean;
  isGeneratingSummary: boolean;
  isGeneratingFlashcards: boolean;
  onCreateManualFlashcard: () => void;
  onCreateManualSummary: () => void;
  onGenerateSummary: () => void;
  onDeleteSummary: () => void;
  isDeletingSummary?: boolean;
  onGenerateFlashcards: () => void;
  onEditFlashcard: (card: Flashcard) => void;
  onDeleteFlashcard: (cardId: string) => void;
  isDeletingFlashcard?: boolean;
  /** Classes extras aplicadas à raiz (usadas para o fade de saída no mobile) */
  className?: string;
}

const AI_TABS = [
  { id: "annotations" as const, label: "Anotações" },
  { id: "arquivos" as const, label: "Arquivos" },
  { id: "flashcards" as const, label: "Flashcards" },
  { id: "summary" as const, label: "Resumo" },
].sort((a, b) => a.label.localeCompare(b.label));

type AiTab = (typeof AI_TABS)[number]["id"];

const AISidebarComponent: React.FC<AISidebarProps> = ({
  editor,
  summary,
  flashcards,
  leafId,
  notebookId,
  canEdit = true,
  canUploadFiles = true,
  isGeneratingSummary,
  isGeneratingFlashcards,
  onCreateManualFlashcard,
  onCreateManualSummary,
  onGenerateSummary,
  onDeleteSummary,
  isDeletingSummary,
  onGenerateFlashcards,
  onEditFlashcard,
  onDeleteFlashcard,
  isDeletingFlashcard,
  className,
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<AiTab>("summary");
  const uploadId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const {
    attachments,
    uploadFiles,
    isUploading,
    uploadProgress,
    deleteAttachment,
    isDeleting,
  } = useAttachments(leafId);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.length) {
        uploadFiles(e.target.files);
        e.target.value = "";
      }
    },
    [uploadFiles],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      if (e.dataTransfer.files.length) {
        uploadFiles(e.dataTransfer.files);
      }
    },
    [uploadFiles],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) return <ImageIcon className="h-4 w-4" />;
    if (mimeType.startsWith("audio/")) return <Music className="h-4 w-4" />;
    if (
      mimeType === "application/pdf" ||
      mimeType.startsWith("text/") ||
      mimeType.includes("word") ||
      mimeType.includes("document")
    )
      return <FileText className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  return (
    <div
      className={`w-full lg:w-[450px] flex flex-col bg-white dark:bg-dark-900 border border-slate-150 dark:border-dark-800 rounded-3xl overflow-hidden max-lg:flex-1 lg:flex-shrink-0 min-h-0 animate-in fade-in duration-300 transition-all duration-300 ease-in-out ${className ?? ""}`}
    >
      {/* Abas */}
      <div className="flex border-b border-slate-100 dark:border-dark-800/60 flex-shrink-0 bg-slate-50 dark:bg-dark-950/20">
        {AI_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-4 text-center font-heading font-bold text-sm tracking-wide transition-all border-b-2 cursor-pointer ${
              activeTab === tab.id
                ? "border-brand-500 text-brand-500"
                : "border-transparent text-slate-500 dark:text-dark-400 hover:text-slate-700"
            }`}
          >
            {tab.id === "flashcards"
              ? `${tab.label} (${flashcards.length})`
              : tab.label}
          </button>
        ))}
      </div>

      {/* Painel Interno */}
      <div className="flex-grow p-6 overflow-y-auto min-h-0">
        {activeTab === "annotations" && (
          <div className="flex flex-col h-full gap-4">
            <AnnotationSidebar editor={editor} />
          </div>
        )}

        {activeTab === "summary" && (
          <div className="flex flex-col h-full gap-4">
            {/* Botão Criar Resumo Manual — apenas com permissão */}
            {canEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={onCreateManualSummary}
                leftIcon={<Plus className="h-3.5 w-3.5" />}
                className="w-full"
              >
                {summary ? 'Editar Resumo Manual' : 'Criar Resumo Manual'}
              </Button>
            )}

            {summary ? (
              <div className="flex flex-col gap-4 relative group">
                {/* Delete button — aparece no hover, mesmo estilo do flashcard */}
                {canEdit && (
                  <div className="absolute top-2 right-2 flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-200 z-10">
                    <button
                      onClick={onDeleteSummary}
                      disabled={isDeletingSummary}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Excluir resumo"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                )}
                <div className="ai-summary-block">
                  {summary}
                </div>
                {canEdit && (
                  <Button
                    variant="outline"
                    onClick={onGenerateSummary}
                    isLoading={isGeneratingSummary}
                    leftIcon={<Sparkles className="h-4 w-4" />}
                  >
                    Atualizar Resumo
                  </Button>
                )}
              </div>
            ) : (
              <EmptyState
                icon={<Sparkles className="h-6 w-6" />}
                title="Nenhum resumo gerado"
                description={
                  canEdit
                    ? "Escreva suas anotações no editor e clique abaixo para gerar um resumo automático (conteúdo de exemplo)."
                    : "O dono do caderno ainda não gerou um resumo para esta folha."
                }
                action={
                  canEdit ? (
                    <Button
                      onClick={onGenerateSummary}
                      isLoading={isGeneratingSummary}
                      leftIcon={<Sparkles className="h-4.5 w-4.5" />}
                      disabled={!editor?.getText()?.trim()}
                    >
                      Gerar Resumo
                    </Button>
                  ) : undefined
                }
              />
            )}
          </div>
        )}

        {activeTab === "flashcards" && (
          <div className="flex flex-col h-full gap-4">
            {canEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={onCreateManualFlashcard}
                leftIcon={<Plus className="h-3.5 w-3.5" />}
                className="w-full"
              >
                Criar Flashcard Manual
              </Button>
            )}

            {flashcards.length === 0 ? (
              <EmptyState
                icon={<HelpCircle className="h-6 w-6" />}
                title="Nenhum flashcard"
                description={
                  canEdit
                    ? "Crie flashcards manualmente ou gere automaticamente (conteúdo de exemplo)."
                    : "O dono do caderno ainda não criou flashcards para esta folha."
                }
                action={
                  canEdit ? (
                    <Button
                      onClick={onGenerateFlashcards}
                      isLoading={isGeneratingFlashcards}
                      leftIcon={<Sparkles className="h-4.5 w-4.5" />}
                      disabled={!editor?.getText()?.trim()}
                    >
                      Gerar Flashcards
                    </Button>
                  ) : undefined
                }
              />
            ) : (
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-400 dark:text-dark-400">
                    {flashcards.length} cards disponíveis
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      navigate(`/notebooks/${notebookId}/study`)
                    }
                    leftIcon={<Play className="h-3.5 w-3.5" />}
                  >
                    Estudar Agora
                  </Button>
                </div>

                <div className="flex flex-col gap-3 max-h-[50vh] overflow-y-auto pr-1">
                  {flashcards.map((card) => (
                    <Card
                      key={card.id}
                      className="p-4 bg-slate-50/50 dark:bg-dark-950/30 border border-slate-100 dark:border-dark-800 flex flex-col gap-2.5 relative group"
                    >
                      {/* Action buttons */}
                      {canEdit && (
                        <div className="absolute top-2 right-2 flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-200">
                          <button
                            onClick={() => onEditFlashcard(card)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-950/30 transition-all duration-150"
                            title="Editar flashcard"
                          >
                            <Pencil className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => onDeleteFlashcard(card.id)}
                            disabled={isDeletingFlashcard}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Mover para lixeira"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                      <div className="text-xs font-bold text-brand-500 tracking-wide uppercase">
                        Pergunta:
                      </div>
                      <p className="text-xs font-semibold text-slate-800 dark:text-dark-100 pr-10">
                        {card.front}
                      </p>
                      <div className="border-t border-dashed border-slate-200 dark:border-dark-800 pt-2 text-xs font-bold text-slate-400 dark:text-dark-450 tracking-wide uppercase">
                        Resposta:
                      </div>
                      <p className="text-xs text-slate-600 dark:text-dark-300">
                        {card.back}
                      </p>
                    </Card>
                  ))}
                </div>

                {canEdit && (
                  <Button
                    variant="outline"
                    onClick={onGenerateFlashcards}
                    isLoading={isGeneratingFlashcards}
                    leftIcon={<Sparkles className="h-4 w-4" />}
                  >
                    Recriar Flashcards
                  </Button>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === "arquivos" && (
          <div className="flex flex-col h-full gap-4">
            {/* Área de drag & drop — apenas com permissão de upload */}
            {canUploadFiles ? (
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 border-dashed cursor-pointer transition-all ${
                  isDragOver
                    ? "border-brand-500 bg-brand-50 dark:bg-brand-950/20"
                    : "border-slate-200 dark:border-dark-700 hover:border-brand-400 hover:bg-slate-50 dark:hover:bg-dark-800/50"
                }`}
              >
                <Upload
                  className={`h-6 w-6 ${isDragOver ? "text-brand-500" : "text-slate-400 dark:text-dark-400"}`}
                />
                <div className="text-center">
                  <p className="text-sm font-semibold text-slate-700 dark:text-dark-200">
                    {isDragOver ? "Solte aqui" : "Arraste arquivos ou clique"}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-dark-400 mt-1">
                    PDF, DOCX, PNG, JPEG, áudio (até 10 MB)
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  id={uploadId}
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.txt,.md,.csv,.html,.png,.jpg,.jpeg,.gif,.webp,.mp3,.wav,.ogg,.webm,.m4a,.aac,.flac"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 p-6 rounded-2xl border-2 border-dashed border-slate-200 dark:border-dark-700">
                <Upload className="h-6 w-6 text-slate-300 dark:text-dark-500" />
                <p className="text-sm font-semibold text-slate-500 dark:text-dark-300">
                  Sem permissão para enviar arquivos
                </p>
                <p className="text-xs text-slate-400 dark:text-dark-400 text-center">
                  Você pode visualizar os arquivos já anexados pelo dono do caderno.
                </p>
              </div>
            )}

            {/* Barra de progresso */}
            {isUploading && Object.keys(uploadProgress).length > 0 && (
              <div className="flex flex-col gap-2">
                {Object.entries(uploadProgress).map(([name, pct]) => (
                  <div key={name} className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-dark-400">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span className="truncate">{name}</span>
                      <span className="ml-auto">{pct}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 dark:bg-dark-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand-500 rounded-full transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Lista de arquivos */}
            {attachments.length > 0 ? (
              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold text-slate-400 dark:text-dark-400">
                  {attachments.length} arquivo{attachments.length !== 1 ? "s" : ""}
                </span>
                <div className="flex flex-col gap-1.5 max-h-[40vh] overflow-y-auto pr-1">
                  {attachments.map((att) => (
                    <div
                      key={att.id}
                      className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/50 dark:bg-dark-950/30 border border-slate-100 dark:border-dark-800 group"
                    >
                      <div className="flex-shrink-0 p-2 rounded-lg bg-slate-100 dark:bg-dark-800 text-slate-500 dark:text-dark-400">
                        {getFileIcon(att.mimeType)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-700 dark:text-dark-200 truncate">
                          {att.fileName}
                        </p>
                        <p className="text-[10px] text-slate-400 dark:text-dark-400">
                          {formatSize(att.size)}
                        </p>
                      </div>
                      {canUploadFiles && (
                        <button
                          onClick={() => deleteAttachment(att.id)}
                          disabled={isDeleting}
                          className="flex-shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all duration-150 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Remover arquivo"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              !isUploading && (
                <div className="text-center py-4">
                  <p className="text-xs text-slate-400 dark:text-dark-400">
                    Nenhum arquivo anexado ainda.
                  </p>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export const AISidebar = memo(AISidebarComponent);
