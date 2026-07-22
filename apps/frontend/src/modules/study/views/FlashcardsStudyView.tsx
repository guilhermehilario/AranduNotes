import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  RefreshCw,
  Eye,
  HelpCircle,
  Brain,
  CheckCircle,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import notebookService from "../../notebooks/services/notebookService";
import studyService from "../services/studyService";
import { useSubmitCardScore } from "../hooks/useFlashcards";
import { PageContainer } from "../../../components/ui/PageContainer.tsx";
import { Card } from "../../../components/ui/Card.tsx";
import { Button } from "../../../components/ui/Button.tsx";
import { ScoreButtons } from "../components/ScoreButtons";
import { StudyResult } from "../components/StudyResult";
import type { Flashcard, StudyScore } from "../types";

export const FlashcardsStudyView: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const notebookId = searchParams.get("notebookId");

  const { data: notebooks = [] } = useQuery({
    queryKey: ["notebooks"],
    queryFn: notebookService.getNotebooks,
    staleTime: 30_000,
  });

  const selectedNotebook = notebooks.find((nb) => nb.id === notebookId);
  const nbId = notebookId || "";

  const { mutateAsync: submitScore } = useSubmitCardScore(undefined, nbId || undefined);

  // Busca todos os flashcards de todos os cadernos ou de um específico
  const { data: allFlashcards = [], isLoading } = useQuery({
    queryKey: ["all-flashcards", notebookId || "all"],
    queryFn: async () => {
      if (notebookId) {
        return studyService.getNotebookFlashcards(notebookId);
      }
      // Pega flashcards de todos os cadernos
      const results = await Promise.all(
        notebooks.map((nb) => studyService.getNotebookFlashcards(nb.id))
      );
      return results.flat();
    },
    enabled: notebooks.length > 0 || !!notebookId,
    staleTime: 30_000,
  });

  // Session state - local since it's a new view
  const [currentIndex, setCurrentIndex] = useState(0);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [sessionFinished, setSessionFinished] = useState(false);
  const [shuffledCards, setShuffledCards] = useState<Flashcard[]>([]);
  const [sessionActive, setSessionActive] = useState(false);

  // Shuffle and start session
  useEffect(() => {
    if (!isLoading && allFlashcards.length > 0 && !sessionActive) {
      const shuffled = [...allFlashcards].sort(() => Math.random() - 0.5);
      setShuffledCards(shuffled);
      setSessionActive(true);
    }
  }, [isLoading, allFlashcards, sessionActive]);

  const cards = shuffledCards;
  const currentCard = cards[currentIndex];
  const progressPercent = cards.length > 0 ? (currentIndex / cards.length) * 100 : 0;

  const handleScoreSelect = useCallback(
    async (score: StudyScore, e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (!currentCard) return;

      const isLastCard = currentIndex >= cards.length - 1;
      const cardIdToSubmit = currentCard.id;

      setReviewedCount((prev) => prev + 1);

      if (!isLastCard) {
        setShowAnswer(false);
        setCurrentIndex((prev) => prev + 1);
      } else {
        setSessionFinished(true);
      }

      try {
        await submitScore({ cardId: cardIdToSubmit, score });
      } catch {
        // Silently fail
      }
    },
    [currentCard, currentIndex, cards.length, submitScore]
  );

  if (isLoading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <RefreshCw className="h-10 w-10 animate-spin text-brand-500" />
      </div>
    );
  }

  if (sessionFinished || cards.length === 0) {
    return (
      <PageContainer>
        <div className="flex items-center justify-between">
          <Link
            to="/studies"
            className="flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-dark-300 hover:text-brand-500 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Voltar aos Estudos
          </Link>
        </div>
        {cards.length === 0 ? (
          <Card className="p-8 text-center">
            <Brain className="h-12 w-12 mx-auto text-slate-300 dark:text-dark-600 mb-3" />
            <h3 className="text-lg font-heading font-bold text-slate-800 dark:text-dark-50 mb-1">
              Nenhum flashcard encontrado
            </h3>
            <p className="text-sm text-slate-500 dark:text-dark-400 mb-4">
              {selectedNotebook
                ? `Crie flashcards em "${selectedNotebook.title}" para estudar.`
                : "Crie flashcards em seus cadernos para começar a estudar."}
            </p>
            <Button onClick={() => navigate("/studies")}>
              Escolher outra matéria
            </Button>
          </Card>
        ) : (
          <StudyResult
            nbId={nbId}
            reviewedCount={reviewedCount}
            flashcardsLength={cards.length}
            onReset={() => {
              setCurrentIndex(0);
              setReviewedCount(0);
              setShowAnswer(false);
              setSessionFinished(false);
              setSessionActive(false);
              setShuffledCards([...allFlashcards].sort(() => Math.random() - 0.5));
            }}
          />
        )}
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/studies"
          className="flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-dark-300 hover:text-brand-500 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar aos Estudos
        </Link>

        <div className="flex items-center gap-3">
          {selectedNotebook && (
            <span
              className="text-xs font-medium px-2 py-0.5 rounded-md"
              style={{
                backgroundColor: `${selectedNotebook.color}15`,
                color: selectedNotebook.color,
              }}
            >
              {selectedNotebook.title}
            </span>
          )}
          <span className="text-sm font-bold text-slate-450 dark:text-dark-400">
            Card {currentIndex + 1} de {cards.length}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2.5 bg-slate-100 dark:bg-dark-900 rounded-full overflow-hidden">
        <div
          className="h-full bg-brand-500 transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Interactive Card */}
      <Card className="min-h-[300px] flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-dark-900 border border-slate-100 dark:border-dark-800 shadow-md relative overflow-hidden">
        <div className="absolute right-4 bottom-4 text-slate-100 dark:text-dark-950 pointer-events-none">
          <Brain className="h-28 w-28 opacity-10" />
        </div>

        <div className="w-full max-w-lg flex flex-col gap-6 items-center">
          {!showAnswer ? (
            <>
              <div className="flex items-center gap-1.5 text-brand-500 text-xs font-bold tracking-wider uppercase">
                <HelpCircle className="h-4 w-4" /> Pergunta de Revisão
              </div>
              <p className="text-xl md:text-2xl font-heading font-semibold text-slate-800 dark:text-dark-50 leading-relaxed">
                {currentCard?.front}
              </p>
              <Button
                onClick={() => setShowAnswer(true)}
                leftIcon={<Eye className="h-4.5 w-4.5" />}
                className="mt-6 shadow-md"
              >
                Revelar Resposta
              </Button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-1.5 text-emerald-500 text-xs font-bold tracking-wider uppercase animate-fade-in">
                <CheckCircle className="h-4 w-4" /> Resposta Correta
              </div>
              <p className="text-lg md:text-xl text-slate-700 dark:text-dark-100 leading-relaxed animate-fade-in">
                {currentCard?.back}
              </p>
            </>
          )}
        </div>
      </Card>

      {showAnswer && <ScoreButtons onScoreSelect={handleScoreSelect} />}
    </PageContainer>
  );
};

export default FlashcardsStudyView;
