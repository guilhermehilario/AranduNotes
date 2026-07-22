import React from "react";
import { CheckCircle, XCircle } from "lucide-react";
import { safeParseOptions } from "../../utils/parse-options";

interface QuestionOptionProps {
  options: string | string[];
  selectedOption: string | null;
  correctAnswer?: string;
  showResult?: boolean;
  disabled?: boolean;
  colorTheme?: "emerald" | "amber" | "rose";
  onSelect: (option: string) => void;
}

const THEME_CLASSES = {
  emerald: {
    selected: "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300",
    hover: "hover:border-emerald-300 dark:hover:border-emerald-700 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/10",
    correct: "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300",
    incorrect: "border-rose-500 bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300",
    faded: "border-slate-200 dark:border-dark-700 opacity-50",
  },
  amber: {
    selected: "border-amber-500 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300",
    hover: "hover:border-amber-300 dark:hover:border-amber-700 hover:bg-amber-50/50 dark:hover:bg-amber-950/10",
    correct: "border-amber-500 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300",
    incorrect: "border-rose-500 bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300",
    faded: "border-slate-200 dark:border-dark-700 opacity-50",
  },
  rose: {
    selected: "border-rose-500 bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300",
    hover: "hover:border-rose-300 dark:hover:border-rose-700 hover:bg-rose-50/50 dark:hover:bg-rose-950/10",
    correct: "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300",
    incorrect: "border-rose-500 bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300",
    faded: "border-slate-200 dark:border-dark-700 opacity-50",
  },
} as const;

export const QuestionOption: React.FC<QuestionOptionProps> = ({
  options,
  selectedOption,
  correctAnswer,
  showResult = false,
  disabled = false,
  colorTheme = "emerald",
  onSelect,
}) => {
  const optionList = Array.isArray(options) ? options : safeParseOptions(options);
  const theme = THEME_CLASSES[colorTheme];

  if (optionList.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      {optionList.map((option, idx) => {
        const isSelected = selectedOption === option;
        const isCorrectAnswer = showResult && correctAnswer === option;
        const isIncorrectSelection = showResult && isSelected && selectedOption !== correctAnswer;

        let optionClass = "flex items-center gap-3 p-3.5 rounded-xl border text-sm font-medium transition-all duration-200 cursor-pointer";

        if (!showResult && !disabled) {
          optionClass += ` border-slate-200 dark:border-dark-700 ${theme.hover}`;
        } else if (isCorrectAnswer) {
          optionClass += ` ${theme.correct}`;
        } else if (isIncorrectSelection) {
          optionClass += ` ${theme.incorrect}`;
        } else if (showResult) {
          optionClass += ` ${theme.faded}`;
        } else {
          optionClass += " border-slate-200 dark:border-dark-700";
        }

        if (disabled && !showResult) {
          optionClass += " cursor-default";
        }

        return (
          <button
            key={idx}
            type="button"
            onClick={() => !disabled && !showResult && onSelect(option)}
            className={optionClass}
            disabled={disabled || showResult}
          >
            <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-dark-800 flex items-center justify-center text-xs font-bold text-slate-500 dark:text-dark-400 flex-shrink-0">
              {String.fromCharCode(65 + idx)}
            </span>
            <span>{option}</span>
            {showResult && isCorrectAnswer && (
              <CheckCircle className="h-4 w-4 text-emerald-500 ml-auto flex-shrink-0" />
            )}
            {showResult && isIncorrectSelection && (
              <XCircle className="h-4 w-4 text-rose-500 ml-auto flex-shrink-0" />
            )}
          </button>
        );
      })}
    </div>
  );
};

export default QuestionOption;
