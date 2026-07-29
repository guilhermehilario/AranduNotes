import { useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { studyService } from "../services/studyService";
import { useSubmitCardScore } from "./useFlashcards";
import type { StudyScore, StudyContent } from "../types";
import type { ReviewItem } from "../components/studyReviewTypes";

interface UseStudyReviewReturn {
  isLoading: boolean;
  sessionStarted: boolean;
  sessionFinished: boolean;
  currentItem: ReviewItem | undefined;
  currentIndex: number;
  totalItems: number;
  correctCount: number;
  selectedOption: string | null;
  showResult: boolean;
  studyContent: StudyContent | undefined;
  startSession: () => void;
  handleNext: () => Promise<void>;
  handleScoreSelect: (
    score: StudyScore,
    e: React.MouseEvent<HTMLButtonElement>,
  ) => Promise<void>;
  setSelectedOption: React.Dispatch<React.SetStateAction<string | null>>;
  setShowResult: React.Dispatch<React.SetStateAction<boolean>>;
  setSessionStarted: React.Dispatch<React.SetStateAction<boolean>>;
}

/**
 * Hook que encapsula toda a lógica de estado e navegação da sessão
 * de revisão combinada (flashcards + questões).
 */
export function useStudyReview(): UseStudyReviewReturn {
  const [searchParams] = useSearchParams();
  const notebookId = searchParams.get("notebookId");

  const { data: studyContent, isLoading } = useQuery({
    queryKey: ["studies", "content", notebookId || "all"],
    queryFn: () => studyService.getContent(notebookId || undefined),
    staleTime: 30_000,
  });

  const { mutateAsync: submitScore } = useSubmitCardScore(
    undefined,
    notebookId || undefined,
  );

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
      const isCorrect =
        selectedOption ===
        (currentItem.data as { correctAnswer: string }).correctAnswer;
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
    async (
      score: StudyScore,
      e: React.MouseEvent<HTMLButtonElement>,
    ) => {
      e.preventDefault();
      e.stopPropagation();
      if (!currentItem || currentItem.type !== "flashcard") return;

      if (score >= 3) setCorrectCount((prev) => prev + 1);

      try {
        await submitScore({
          cardId: (currentItem.data as { id: string }).id,
          score,
        });
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
    [currentItem, isLastItem, submitScore],
  );

  return {
    isLoading,
    sessionStarted,
    sessionFinished,
    currentItem,
    currentIndex,
    totalItems,
    correctCount,
    selectedOption,
    showResult,
    studyContent,
    startSession,
    handleNext,
    handleScoreSelect,
    setSelectedOption,
    setShowResult,
    setSessionStarted,
  };
}
