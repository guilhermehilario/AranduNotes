import { useState, memo, useId } from "react";
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
} from "lucide-react";
import { AnnotationSidebar } from "./AnnotationSidebar";
import { Card } from "../../../components/ui/Card.tsx";
import { Button } from "../../../components/ui/Button.tsx";
import { EmptyState } from "../../../components/ui/EmptyState.tsx";
import type { Flashcard } from "../../study/types";

interface AISidebarProps {
  editor: Editor | null;
  summary: string | null | undefined;
  flashcards: Flashcard[];
  notebookId: string;
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
  notebookId,
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
            {/* Botão Criar Resumo Manual — sempre visível */}
            <Button
              variant="outline"
              size="sm"
              onClick={onCreateManualSummary}
              leftIcon={<Plus className="h-3.5 w-3.5" />}
              className="w-full"
            >
              {summary ? 'Editar Resumo Manual' : 'Criar Resumo Manual'}
            </Button>

            {summary ? (
              <div className="flex flex-col gap-4 relative group">
                {/* Delete button — aparece no hover, mesmo estilo do flashcard */}
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
                <div className="ai-summary-block">
                  {summary}
                </div>
                <Button
                  variant="outline"
                  onClick={onGenerateSummary}
                  isLoading={isGeneratingSummary}
                  leftIcon={<Sparkles className="h-4 w-4" />}
                >
                  Atualizar Resumo
                </Button>
              </div>
            ) : (
              <EmptyState
                icon={<Sparkles className="h-6 w-6" />}
                title="Nenhum resumo gerado"
                description="Escreva suas anotações no editor e clique abaixo para gerar um resumo inteligente."
                action={
                  <Button
                    onClick={onGenerateSummary}
                    isLoading={isGeneratingSummary}
                    leftIcon={<Sparkles className="h-4.5 w-4.5" />}
                    disabled={!editor?.getText()?.trim()}
                  >
                    Gerar Resumo por IA
                  </Button>
                }
              />
            )}
          </div>
        )}

        {activeTab === "flashcards" && (
          <div className="flex flex-col h-full gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={onCreateManualFlashcard}
              leftIcon={<Plus className="h-3.5 w-3.5" />}
              className="w-full"
            >
              Criar Flashcard Manual
            </Button>

            {flashcards.length === 0 ? (
              <EmptyState
                icon={<HelpCircle className="h-6 w-6" />}
                title="Nenhum flashcard"
                description="Crie flashcards manualmente ou gere por IA."
                action={
                  <Button
                    onClick={onGenerateFlashcards}
                    isLoading={isGeneratingFlashcards}
                    leftIcon={<Sparkles className="h-4.5 w-4.5" />}
                    disabled={!editor?.getText()?.trim()}
                  >
                    Gerar Flashcards por IA
                  </Button>
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

                <Button
                  variant="outline"
                  onClick={onGenerateFlashcards}
                  isLoading={isGeneratingFlashcards}
                  leftIcon={<Sparkles className="h-4 w-4" />}
                >
                  Recriar Flashcards
                </Button>
              </div>
            )}
          </div>
        )}

        {activeTab === "arquivos" && (
          <EmptyState
            icon={<Upload className="h-6 w-6" />}
            title="Anexar Arquivos"
            description="Arraste arquivos ou clique para fazer upload de imagens, PDFs e documentos para esta folha."
            action={
              <label htmlFor={uploadId} className="cursor-pointer">
                <div className="ai-upload-button">
                  <Upload className="h-4 w-4" />
                  Selecionar Arquivos
                </div>
                <input id={uploadId} type="file" multiple className="hidden" />
              </label>
            }
          />
        )}
      </div>
    </div>
  );
};

export const AISidebar = memo(AISidebarComponent);
