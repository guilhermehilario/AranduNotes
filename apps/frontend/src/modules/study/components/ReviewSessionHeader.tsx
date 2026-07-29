import React from "react";
import { ArrowLeft } from "lucide-react";
import type { ReviewItemType } from "./studyReviewTypes";

interface ReviewSessionHeaderProps {
  type: ReviewItemType;
  currentIndex: number;
  totalItems: number;
  onExit: () => void;
}

export const ReviewSessionHeader: React.FC<ReviewSessionHeaderProps> = ({
  type,
  currentIndex,
  totalItems,
  onExit,
}) => {
  const isFlashcard = type === "flashcard";

  return (
    <div className="flex items-center justify-between">
      <button
        type="button"
        onClick={onExit}
        className="flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-dark-300 hover:text-brand-500 transition-colors cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4" /> Sair da Revisão
      </button>
      <div className="flex items-center gap-2">
        <span
          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            isFlashcard
              ? "bg-rose-100 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400"
              : "bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400"
          }`}
        >
          {isFlashcard ? "Flashcard" : "Questão"}
        </span>
        <span className="text-sm font-bold text-slate-450 dark:text-dark-400">
          {currentIndex + 1}/{totalItems}
        </span>
      </div>
    </div>
  );
};
