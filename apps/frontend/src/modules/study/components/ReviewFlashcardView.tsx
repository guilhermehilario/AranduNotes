import React from "react";
import { HelpCircle, Eye, CheckCircle } from "lucide-react";
import { Card } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { ScoreButtons } from "./ScoreButtons";
import { ReviewSessionHeader } from "./ReviewSessionHeader";
import type { ReviewItem } from "./studyReviewTypes";
import type { StudyScore } from "../types";

interface ReviewFlashcardViewProps {
  item: ReviewItem;
  currentIndex: number;
  totalItems: number;
  showResult: boolean;
  onRevealAnswer: () => void;
  onScoreSelect: (
    score: StudyScore,
    e: React.MouseEvent<HTMLButtonElement>,
  ) => Promise<void>;
  onExit: () => void;
}

export const ReviewFlashcardView: React.FC<ReviewFlashcardViewProps> = ({
  item,
  currentIndex,
  totalItems,
  showResult,
  onRevealAnswer,
  onScoreSelect,
  onExit,
}) => {
  const card = item.data as { front: string; back: string };

  return (
    <div className="flex flex-col gap-6">
      <ReviewSessionHeader
        type="flashcard"
        currentIndex={currentIndex}
        totalItems={totalItems}
        onExit={onExit}
      />

      <Card className="min-h-[250px] flex flex-col items-center justify-center p-8 text-center">
        {!showResult ? (
          <>
            <div className="flex items-center gap-1.5 text-brand-500 text-xs font-bold tracking-wider uppercase mb-4">
              <HelpCircle className="h-4 w-4" /> Pergunta
            </div>
            <p className="text-xl font-heading font-semibold text-slate-800 dark:text-dark-50 leading-relaxed w-full min-w-0">
              {card.front}
            </p>
            <Button
              onClick={onRevealAnswer}
              leftIcon={<Eye className="h-4.5 w-4.5" />}
              className="mt-6 shadow-md"
            >
              Revelar Resposta
            </Button>
          </>
        ) : (
          <>
            <div className="flex items-center gap-1.5 text-emerald-500 text-xs font-bold tracking-wider uppercase mb-4">
              <CheckCircle className="h-4 w-4" /> Resposta Correta
            </div>
            <p className="text-lg text-slate-700 dark:text-dark-100 leading-relaxed mb-6 w-full min-w-0">
              {card.back}
            </p>
          </>
        )}
      </Card>

      {showResult && <ScoreButtons onScoreSelect={onScoreSelect} />}
    </div>
  );
};
