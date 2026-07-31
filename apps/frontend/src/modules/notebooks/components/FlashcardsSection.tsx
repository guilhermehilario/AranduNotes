import React from 'react';
import { Sparkles, Lightbulb, Loader2, Pencil, Trash2 } from 'lucide-react';
import { Card } from '../../../components/ui/Card.tsx';
import { Button } from '../../../components/ui/Button.tsx';
import { EmptyState } from '../../../components/ui/EmptyState.tsx';
import type { Flashcard } from '../../study/types';

interface FlashcardsSectionProps {
  flashcards: Flashcard[];
  isLoading: boolean;
  onOpenCreateModal: () => void;
  onEditFlashcard: (card: Flashcard) => void;
  onDeleteFlashcard: (cardId: string) => void;
  isDeletingFlashcard?: boolean;
}

export const FlashcardsSection: React.FC<FlashcardsSectionProps> = ({
  flashcards,
  isLoading,
  onOpenCreateModal,
  onEditFlashcard,
  onDeleteFlashcard,
  isDeletingFlashcard,
}) => {

  return (
    <div className="flex flex-col gap-4 mt-6 pt-6 border-t border-slate-100 dark:border-dark-800">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-heading font-bold text-slate-800 dark:text-dark-100 m-0">
          Flashcards ({flashcards.length})
        </h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenCreateModal}
            leftIcon={<Sparkles className="h-4 w-4" />}
          >
            Criar Flashcard
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
        </div>
      ) : flashcards.length === 0 ? (
        <EmptyState
          icon={<Lightbulb className="h-6 w-6" />}
          title="Nenhum flashcard criado"
          description="Crie flashcards manualmente ou gere automaticamente pela IA ao editar uma folha."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {flashcards.slice(0, 10).map((card) => (
            <Card
              key={card.id}
              className="flex flex-col gap-2 p-4 border border-slate-100 dark:border-dark-800 relative group"
            >
              {/* Action buttons */}
              <div              className="absolute top-2 right-2 flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-200">
                <button
                  onClick={() => onEditFlashcard(card)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-950/30 transition-all duration-150"
                  title="Editar flashcard"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => onDeleteFlashcard(card.id)}
                  disabled={isDeletingFlashcard}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Mover para lixeira"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <p className="text-sm font-semibold text-slate-800 dark:text-dark-50 line-clamp-2 pr-14 break-words">
                <span className="text-xs font-bold text-brand-500 mr-1.5">Q:</span>
                {card.front}
              </p>
              <p className="text-sm text-slate-500 dark:text-dark-350 line-clamp-2 break-words">
                <span className="text-xs font-bold text-emerald-500 mr-1.5">R:</span>
                {card.back}
              </p>
              <div className="flex gap-2 mt-1">
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-dark-800 text-slate-400 dark:text-dark-400">
                  Repetições: {card.repetitions}
                </span>
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-dark-800 text-slate-400 dark:text-dark-400">
                  EF: {card.easeFactor}
                </span>
              </div>
            </Card>
          ))}
          {flashcards.length > 10 && (
            <p className="text-xs text-slate-400 dark:text-dark-400 text-center col-span-full pt-2">
              + {flashcards.length - 10} flashcards ocultos. Estude-os na sessão de revisão.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default FlashcardsSection;
