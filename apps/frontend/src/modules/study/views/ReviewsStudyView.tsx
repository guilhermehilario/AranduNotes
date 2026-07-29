import React from "react";
import { useNavigate } from "react-router-dom";
import { RefreshCw } from "lucide-react";
import { PageContainer } from "../../../components/ui/PageContainer";
import { useStudyReview } from "../hooks/useStudyReview";
import { ReviewInitialScreen } from "../components/ReviewInitialScreen";
import { ReviewFinishedScreen } from "../components/ReviewFinishedScreen";
import { ReviewFlashcardView } from "../components/ReviewFlashcardView";
import { ReviewQuestionView } from "../components/ReviewQuestionView";

export const ReviewsStudyView: React.FC = () => {
  const navigate = useNavigate();

  const {
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
  } = useStudyReview();

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
    const totalAvailable =
      (studyContent?.flashcardsDue.length || 0) +
      Math.min(studyContent?.questions.length || 0, 10);

    return (
      <PageContainer>
        <ReviewInitialScreen
          studyContent={studyContent}
          totalItems={totalAvailable}
          onStartSession={startSession}
          onNavigateBack={() => navigate("/studies")}
        />
      </PageContainer>
    );
  }

  // Session finished
  if (sessionFinished) {
    return (
      <PageContainer>
        <ReviewFinishedScreen
          correctCount={correctCount}
          totalItems={totalItems}
          onNewReview={startSession}
          onOtherStudy={() => navigate("/studies")}
        />
      </PageContainer>
    );
  }

  if (!currentItem) return null;

  // Render flashcard
  if (currentItem.type === "flashcard") {
    return (
      <PageContainer>
        <ReviewFlashcardView
          item={currentItem}
          currentIndex={currentIndex}
          totalItems={totalItems}
          showResult={showResult}
          onRevealAnswer={() => setShowResult(true)}
          onScoreSelect={handleScoreSelect}
          onExit={() => setSessionStarted(false)}
        />
      </PageContainer>
    );
  }

  // Render question
  const isLastItem = currentIndex >= totalItems - 1;

  return (
    <PageContainer>
      <ReviewQuestionView
        item={currentItem}
        currentIndex={currentIndex}
        totalItems={totalItems}
        selectedOption={selectedOption}
        isLastItem={isLastItem}
        onSelectOption={setSelectedOption}
        onNext={handleNext}
        onExit={() => setSessionStarted(false)}
      />
    </PageContainer>
  );
};

export default ReviewsStudyView;
