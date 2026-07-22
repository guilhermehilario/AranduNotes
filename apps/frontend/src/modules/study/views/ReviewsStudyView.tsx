import React, { useState, useCallback } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  RefreshCw,
  BookOpen,
  CheckCircle,
  Eye,
  HelpCircle,
  Sparkles,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { studyService } from "../services/studyService";
import { useSubmitCardScore } from "../hooks/useFlashcards";
import { PageContainer } from "../../../components/ui/PageContainer.tsx";
import { Card } from "../../../components/ui/Card.tsx";
import { Button } from "../../../components/ui/Button.tsx";
import { ScoreButtons } from "../components/ScoreButtons";
import { QuestionOption } from "../../../components/ui/QuestionOption.tsx";
import type { Flashcard, StudyScore } from "../types";

type ReviewItemType = "flashcard" | "question";

interface ReviewItem {
  type: ReviewItemType;
  data: Flashcard | { id: string; question: string; correctAnswer: string; options: string; explanation: string | null };
}

export const ReviewsStudyView: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const notebookId = searchParams.get("notebookId");

  const { data: studyContent, isLoading } = useQuery({
    queryKey: ["studies", "content", notebookId || "all"],
    queryFn: () => studyService.getContent(notebookId || undefined),
    staleTime: 30_000,
  });

  const { mutateAsync: submitScore } = useSubmitCardScore(undefined, notebookId || undefined);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [sessionFinished, setSessionFinished] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [reviewCards, setReviewCards] = useState<ReviewItem[]>([]);
  const [correctCount, setCorrectCount] = useState(0);

  const startSession = useCallback(() => {
    if (!studyContent) return;

    const items: ReviewItem[] = [];

    // Add due flashcards
    studyContent.flashcardsDue.forEach((fc) => {
      items.push({ type: "flashcard", data: fc });
    });

    // Add questions (up to 10)
    studyContent.questions.slice(0, 10).forEach((q) => {
      items.push({ type: "question", data: q });
    });

    // Shuffle
    const shuffled = items.sort(() => Math.random() - 0.5);
    setReviewCards(shuffled);
    setSessionStarted(true);
    setCurrentIndex(0);
    setSelectedOption(null);
    setShowResult(false);
    setSessionFinished(false);
    setCorrectCount(0);
  }, [studyContent]);

  const currentItem = reviewCards[currentIndex];
  const isLastItem = currentIndex >= reviewCards.length - 1;
  const totalItems = reviewCards.length;

  const handleNext = useCallback(async () => {
    if (!currentItem) return;

    if (currentItem.type === "flashcard") {
      // Flashcard: show answer first, then score
      if (!showResult) {
        setShowResult(true);
        return;
      }
    }

    if (currentItem.type === "question" && selectedOption) {
      const isCorrect = selectedOption === (currentItem.data as { correctAnswer: string }).correctAnswer;
      if (isCorrect) setCorrectCount((prev) => prev + 1);
    }

    if (isLastItem) {
      setSessionFinished(true);
      return;
    }

    setCurrentIndex((prev) => prev + 1);
    setSelectedOption(null);
    setShowResult(false);
  }, [currentItem, showResult, selectedOption, isLastItem]);

  const handleScoreSelect = useCallback(
    async (score: StudyScore, e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (!currentItem || currentItem.type !== "flashcard") return;

      if (score >= 3) setCorrectCount((prev) => prev + 1);

      try {
        await submitScore({ cardId: (currentItem.data as Flashcard).id, score });
      } catch {
        // Silently fail
      }

      if (isLastItem) {
        setSessionFinished(true);
      } else {
        setCurrentIndex((prev) => prev + 1);
        setShowResult(false);
      }
    },
    [currentItem, isLastItem, submitScore]
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <RefreshCw className="h-10 w-10 animate-spin text-brand-500" />
      </div>
    );
  }

  // Initial screen
  if (!sessionStarted) {
    const totalItems =
      (studyContent?.flashcardsDue.length || 0) + Math.min(studyContent?.questions.length || 0, 10);

    return (
      <PageContainer>
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
          {totalItems > 0 ? (
            <>
              <div className="flex items-center justify-center gap-6 my-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-brand-500">
                    {studyContent?.flashcardsDue.length || 0}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-dark-500">Flashcards</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-emerald-500">
                    {Math.min(studyContent?.questions.length || 0, 10)}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-dark-500">Questões</p>
                </div>
              </div>
              <Button onClick={startSession} leftIcon={<Sparkles className="h-4 w-4" />}>
                Iniciar Revisão ({totalItems} itens)
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm text-slate-400 dark:text-dark-500 mb-4">
                Nada para revisar no momento. Crie flashcards e questões para aparecerem aqui.
              </p>
              <Button onClick={() => navigate("/studies")}>Voltar</Button>
            </>
          )}
        </Card>
      </PageContainer>
    );
  }

  // Session finished
  if (sessionFinished) {
    return (
      <PageContainer>
        <Link
          to="/studies"
          className="flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-dark-300 hover:text-brand-500 transition-colors w-fit"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar aos Estudos
        </Link>

        <Card className="p-8 text-center">
          <CheckCircle className="h-16 w-16 mx-auto text-emerald-500 mb-4" />
          <h3 className="text-2xl font-heading font-bold text-slate-800 dark:text-dark-50 mb-2">
            Revisão Concluída!
          </h3>
          <p className="text-4xl font-bold text-brand-500 mb-1">
            {correctCount}/{totalItems}
          </p>
          <p className="text-sm text-slate-500 dark:text-dark-400 mb-6">
            {totalItems > 0 ? ((correctCount / totalItems) * 100).toFixed(0) : 0}% de aproveitamento
          </p>
          <div className="flex items-center justify-center gap-3">
            <Button onClick={startSession} variant="secondary">
              Nova Revisão
            </Button>
            <Button onClick={() => navigate("/studies")}>
              Outro Estudo
            </Button>
          </div>
        </Card>
      </PageContainer>
    );
  }

  // No items
  if (reviewCards.length === 0) {
    return (
      <PageContainer>
        <Card className="p-8 text-center">
          <BookOpen className="h-12 w-12 mx-auto text-slate-300 dark:text-dark-600 mb-3" />
          <h3 className="text-lg font-heading font-bold text-slate-800 dark:text-dark-50 mb-1">
            Nada para revisar
          </h3>
          <Button onClick={() => navigate("/studies")}>Voltar</Button>
        </Card>
      </PageContainer>
    );
  }

  if (!currentItem) return null;

  // Render flashcard
  if (currentItem.type === "flashcard") {
    const card = currentItem.data as Flashcard;
    return (
      <PageContainer>
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setSessionStarted(false)}
            className="flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-dark-300 hover:text-brand-500 transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" /> Sair da Revisão
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 font-medium">
              Flashcard
            </span>
            <span className="text-sm font-bold text-slate-450 dark:text-dark-400">
              {currentIndex + 1}/{totalItems}
            </span>
          </div>
        </div>

        <Card className="min-h-[250px] flex flex-col items-center justify-center p-8 text-center">
          {!showResult ? (
            <>
              <div className="flex items-center gap-1.5 text-brand-500 text-xs font-bold tracking-wider uppercase mb-4">
                <HelpCircle className="h-4 w-4" /> Pergunta
              </div>
              <p className="text-xl font-heading font-semibold text-slate-800 dark:text-dark-50 leading-relaxed">
                {card.front}
              </p>
              <Button
                onClick={() => setShowResult(true)}
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
              <p className="text-lg text-slate-700 dark:text-dark-100 leading-relaxed mb-6">
                {card.back}
              </p>
            </>
          )}
        </Card>

        {showResult && <ScoreButtons onScoreSelect={handleScoreSelect} />}
      </PageContainer>
    );
  }

  // Render question
  const question = currentItem.data as any;

  return (
    <PageContainer>
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setSessionStarted(false)}
          className="flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-dark-300 hover:text-brand-500 transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" /> Sair da Revisão
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 font-medium">
            Questão
          </span>
          <span className="text-sm font-bold text-slate-450 dark:text-dark-400">
            {currentIndex + 1}/{totalItems}
          </span>
        </div>
      </div>

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
          onSelect={(option) => !selectedOption && setSelectedOption(option)}
        />

        {selectedOption && question.explanation && (
          <div className="mt-4 p-3.5 rounded-xl bg-slate-50 dark:bg-dark-800/50 border border-slate-100 dark:border-dark-700">
            <p className="text-xs font-bold text-slate-500 dark:text-dark-400 mb-1">Explicação</p>
            <p className="text-sm text-slate-600 dark:text-dark-300">{question.explanation}</p>
          </div>
        )}

        {selectedOption && (
          <div className="mt-6 flex justify-end">
            <Button onClick={handleNext}>
              {isLastItem ? "Ver Resultado" : "Próximo"}
            </Button>
          </div>
        )}
      </Card>
    </PageContainer>
  );
};

export default ReviewsStudyView;
