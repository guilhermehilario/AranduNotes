import React from "react";
import { Card } from "../../../../components/ui/Card";
import { Button } from "../../../../components/ui/Button";
import { QuestionOption } from "../../../../components/ui/QuestionOption";
import { ReviewSessionHeader } from "./ReviewSessionHeader";
import type { ReviewItem } from "./studyReviewTypes";

interface ReviewQuestionViewProps {
  item: ReviewItem;
  currentIndex: number;
  totalItems: number;
  selectedOption: string | null;
  isLastItem: boolean;
  onSelectOption: (option: string) => void;
  onNext: () => void;
  onExit: () => void;
}

export const ReviewQuestionView: React.FC<ReviewQuestionViewProps> = ({
  item,
  currentIndex,
  totalItems,
  selectedOption,
  isLastItem,
  onSelectOption,
  onNext,
  onExit,
}) => {
  const question = item.data as {
    question: string;
    options: string;
    correctAnswer: string;
    explanation: string | null;
  };

  return (
    <div className="flex flex-col gap-6">
      <ReviewSessionHeader
        type="question"
        currentIndex={currentIndex}
        totalItems={totalItems}
        onExit={onExit}
      />

      <Card className="p-6">
        <p className="text-lg font-heading font-semibold text-slate-800 dark:text-dark-50 leading-relaxed mb-6">
          {question.question}
        </p>

        <QuestionOption
          options={question.options}
          selectedOption={selectedOption}
          correctAnswer={question.correctAnswer}
          showResult={!!selectedOption}
          colorTheme="rose"
          onSelect={(option) => !selectedOption && onSelectOption(option)}
        />

        {selectedOption && question.explanation && (
          <div className="mt-4 p-3.5 rounded-xl bg-slate-50 dark:bg-dark-800/50 border border-slate-100 dark:border-dark-700">
            <p className="text-xs font-bold text-slate-500 dark:text-dark-400 mb-1">
              Explicação
            </p>
            <p className="text-sm text-slate-600 dark:text-dark-300">
              {question.explanation}
            </p>
          </div>
        )}

        {selectedOption && (
          <div className="mt-6 flex justify-end">
            <Button onClick={onNext}>
              {isLastItem ? "Ver Resultado" : "Próximo"}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};
