import React, { useState, useEffect, useRef, startTransition, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  RefreshCw,
  Eye,
  HelpCircle,
  Brain,
  CheckCircle,
} from "lucide-react";
import {
  useNotebookFlashcards,
  useSubmitCardScore,
} from "../hooks/useFlashcards";
import { useStudySessionPersistence } from "../hooks/useStudySessionPersistence";
import { useStudyStore } from "../studyStore";
import { PageContainer } from "../../../components/ui/PageContainer.tsx";
import { Card } from "../../../components/ui/Card.tsx";
import { Button } from "../../../components/ui/Button.tsx";
import { SaveStatusIndicator } from "../../../components/ui/SaveStatusIndicator.tsx";
import type { SaveStatus } from "../../../components/ui/SaveStatusIndicator.tsx";
import { ScoreButtons } from "../components/ScoreButtons";
import { StudyResult } from "../components/StudyResult";
import type { StudyScore } from "../types";

export const StudyView: React.FC = () => {
  const { notebookId } = useParams<{ notebookId: string }>();
  const nbId = notebookId ?? "";

  // ⚡ Persistência automática da sessão de estudo no backend
  const { clearPersistedSession } = useStudySessionPersistence(nbId);

  const { data: serverFlashcards = [], isLoading } =
    useNotebookFlashcards(nbId);
  const { mutateAsync: submitScore } = useSubmitCardScore(undefined, nbId);

  // ── Zustand Store (dados persistem entre remounts) ──
  const sessionSlot = useStudyStore((s) => s.sessions[nbId]);
  const setCurrentIndex = useStudyStore((s) => s.setCurrentIndex);
  const setReviewedCount = useStudyStore((s) => s.setReviewedCount);
  const setShowAnswer = useStudyStore((s) => s.setShowAnswer);
  const setSessionActive = useStudyStore((s) => s.setSessionActive);
  const setSessionFlashcards = useStudyStore((s) => s.setSessionFlashcards);
  const markCardCompleted = useStudyStore((s) => s.markCardCompleted);
  const resetSession = useStudyStore((s) => s.resetSession);

  const currentIndex = sessionSlot?.currentIndex ?? 0;
  const reviewedCount = sessionSlot?.reviewedCount ?? 0;
  const showAnswer = sessionSlot?.showAnswer ?? false;
  const frozenFlashcards = sessionSlot?.flashcards ?? [];

  // ── Estado local transitório (não afeta progresso) ──
  const [sessionFinished, setSessionFinished] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const saveStatusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Ref que impede congelamentos múltiplos após remount
  const freezeAttemptedRef = useRef(false);

  // ── Reset automático ao navegar entre notebooks ──────────────
  useEffect(() => {
    freezeAttemptedRef.current = false;
    startTransition(() => {
      setSessionFinished(false);
      setSaveStatus("idle");
    });
  }, [nbId]);

  // ── Congela os flashcards na Zustand Store UMA VEZ ──
  useEffect(() => {
    if (
      !isLoading &&
      serverFlashcards.length > 0 &&
      !freezeAttemptedRef.current &&
      frozenFlashcards.length === 0
    ) {
      freezeAttemptedRef.current = true;
      startTransition(() => {
        setSessionFlashcards(nbId, serverFlashcards);
        setSessionActive(nbId, true);
      });
    }
  }, [
    isLoading,
    serverFlashcards,
    frozenFlashcards.length,
    nbId,
    setSessionFlashcards,
    setSessionActive,
  ]);

  const flashcards =
    frozenFlashcards.length > 0 ? frozenFlashcards : serverFlashcards;
  const currentCard = flashcards[currentIndex];
  const progressPercent =
    flashcards.length > 0 ? (currentIndex / flashcards.length) * 100 : 0;

  const handleScoreSelect = useCallback(
    async (score: StudyScore, e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (!currentCard) return;

      const isLastCard = currentIndex >= flashcards.length - 1;
      const cardIdToSubmit = currentCard.id;

      setSaveStatus("saving");
      setReviewedCount(nbId, reviewedCount + 1);
      markCardCompleted(nbId, cardIdToSubmit, score);

      if (!isLastCard) {
        setShowAnswer(nbId, false);
        setCurrentIndex(nbId, currentIndex + 1);
      } else {
        setSessionFinished(true);
      }

      try {
        await submitScore({ cardId: cardIdToSubmit, score });
        startTransition(() => {
          setSaveStatus("saved");
          if (saveStatusTimerRef.current !== null) {
            clearTimeout(saveStatusTimerRef.current);
          }
          saveStatusTimerRef.current = setTimeout(
            () => setSaveStatus("idle"),
            2000,
          );
        });
      } catch {
        startTransition(() => {
          setSaveStatus("error");
        });
      }
    },
    [
      currentCard,
      currentIndex,
      flashcards.length,
      nbId,
      reviewedCount,
      setCurrentIndex,
      setReviewedCount,
      setShowAnswer,
      markCardCompleted,
      submitScore,
    ],
  );

  // Cleanup do timer de auto-reset do saveStatus ao desmontar
  useEffect(() => {
    return () => {
      if (saveStatusTimerRef.current !== null) {
        clearTimeout(saveStatusTimerRef.current);
      }
    };
  }, []);

  if (isLoading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <RefreshCw className="h-10 w-10 animate-spin text-brand-500" />
      </div>
    );
  }

  // Caso não existam flashcards ou sessão finalizada
  if ((flashcards.length === 0 && !sessionFinished) || sessionFinished) {
    return (
      <StudyResult
        nbId={nbId}
        reviewedCount={reviewedCount}
        flashcardsLength={sessionFinished ? flashcards.length : 0}
        onReset={() => {
          resetSession(nbId);
          clearPersistedSession();
          setSessionFinished(false);
        }}
      />
    );
  }

  return (
    <PageContainer>
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to={`/notebooks/${nbId}`}
          className="flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-dark-300 hover:text-brand-500 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Parar Revisão
        </Link>

        <div className="flex items-center gap-3">
          {/* ── Indicador de salvamento ── */}
          <SaveStatusIndicator status={saveStatus} />

          <span className="text-sm font-bold text-slate-450 dark:text-dark-400">
            Card {currentIndex + 1} de {flashcards.length}
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
        {/* Marca d'água no fundo */}
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
                onClick={() => setShowAnswer(nbId, true)}
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

      {/* Rating Buttons - Show only when answer is revealed */}
      {showAnswer && <ScoreButtons onScoreSelect={handleScoreSelect} />}
    </PageContainer>
  );
};

export default StudyView;
