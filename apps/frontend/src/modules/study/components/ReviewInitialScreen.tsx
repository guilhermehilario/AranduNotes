import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, BookOpen, Sparkles } from "lucide-react";
import { Card } from "../../../../components/ui/Card";
import { Button } from "../../../../components/ui/Button";
import type { StudyContent } from "../types";

interface ReviewInitialScreenProps {
  studyContent: StudyContent | undefined;
  totalItems: number;
  onStartSession: () => void;
  onNavigateBack: () => void;
}

export const ReviewInitialScreen: React.FC<ReviewInitialScreenProps> = ({
  studyContent,
  totalItems,
  onStartSession,
  onNavigateBack,
}) => {
  if (totalItems === 0) {
    return (
      <div className="flex flex-col gap-6">
        <Link
          to="/studies"
          className="flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-dark-300 hover:text-brand-500 transition-colors w-fit"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar aos Estudos
        </Link>
        <Card className="p-8 text-center">
          <BookOpen className="h-12 w-12 mx-auto text-slate-300 dark:text-dark-600 mb-3" />
          <h3 className="text-lg font-heading font-bold text-slate-800 dark:text-dark-50 mb-1">
            Nada para revisar
          </h3>
          <p className="text-sm text-slate-400 dark:text-dark-500 mb-4">
            Nada para revisar no momento. Crie flashcards e questões para
            aparecerem aqui.
          </p>
          <Button onClick={onNavigateBack}>Voltar</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Link
        to="/studies"
        className="flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-dark-300 hover:text-brand-500 transition-colors w-fit"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar aos Estudos
      </Link>
      <Card className="p-8 text-center">
        <BookOpen className="h-12 w-12 mx-auto text-rose-500 mb-3" />
        <h3 className="text-lg font-heading font-bold text-slate-800 dark:text-dark-50 mb-1">
          Revisão Geral
        </h3>
        <p className="text-sm text-slate-500 dark:text-dark-400 mb-2">
          Revisão combinada de flashcards pendentes e questões
        </p>
        <div className="flex items-center justify-center gap-6 my-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-brand-500">
              {studyContent?.flashcardsDue.length || 0}
            </p>
            <p className="text-xs text-slate-400 dark:text-dark-500">
              Flashcards
            </p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-emerald-500">
              {Math.min(studyContent?.questions.length || 0, 10)}
            </p>
            <p className="text-xs text-slate-400 dark:text-dark-500">
              Questões
            </p>
          </div>
        </div>
        <Button
          onClick={onStartSession}
          leftIcon={<Sparkles className="h-4 w-4" />}
        >
          Iniciar Revisão ({totalItems} itens)
        </Button>
      </Card>
    </div>
  );
};
