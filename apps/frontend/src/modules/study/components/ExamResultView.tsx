import React from "react";
import { Timer, CheckCircle } from "lucide-react";
import { PageContainer } from "../../../components/ui/PageContainer.tsx";
import { Card } from "../../../components/ui/Card.tsx";
import { Button } from "../../../components/ui/Button.tsx";
import type { MockExam } from "../types";

interface ExamResultViewProps {
  exam: MockExam;
  answers: Record<string, string>;
  onBack: () => void;
  onRestart: () => void;
}

export const ExamResultView: React.FC<ExamResultViewProps> = ({
  exam,
  answers,
  onBack,
  onRestart,
}) => {
  const questions = exam.questions?.map((eq) => eq.question) || [];
  const total = questions.length;
  const correctCount = questions.filter(
    (q) => answers[q.id] === q.correctAnswer,
  ).length;
  const percentage = total > 0 ? ((correctCount / total) * 100).toFixed(0) : "0";

  return (
    <PageContainer>
      <Card className="p-8 text-center">
        <div className="flex items-center justify-center mb-4">
          {Number(percentage) >= 70 ? (
            <CheckCircle className="h-16 w-16 text-emerald-500" />
          ) : (
            <Timer className="h-16 w-16 text-amber-500" />
          )}
        </div>
        <h3 className="text-2xl font-heading font-bold text-slate-800 dark:text-dark-50 mb-2">
          {exam.title} - Resultado
        </h3>
        <p className="text-4xl font-bold text-brand-500 mb-1">
          {correctCount}/{total}
        </p>
        <p className="text-sm text-slate-500 dark:text-dark-400 mb-6">
          {percentage}% de acerto
        </p>
        <div className="flex items-center justify-center gap-3">
          <Button onClick={onBack} variant="secondary">
            Voltar
          </Button>
          <Button onClick={onRestart}>Refazer</Button>
        </div>
      </Card>

      <div className="flex flex-col gap-2">
        {questions.map((q, idx) => {
          const userAnswer = answers[q.id];
          const isCorrect = userAnswer === q.correctAnswer;
          return (
            <Card key={q.id} className="p-4">
              <div className="flex items-start gap-3">
                <span
                  className={`text-lg font-bold flex-shrink-0 ${
                    isCorrect ? "text-emerald-500" : "text-rose-500"
                  }`}
                >
                  {isCorrect ? "✓" : "✗"}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800 dark:text-dark-50">
                    {idx + 1}. {q.question}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-dark-400 mt-1">
                    Sua resposta:{" "}
                    <span
                      className={
                        isCorrect
                          ? "text-emerald-500 font-semibold"
                          : "text-rose-500 font-semibold"
                      }
                    >
                      {userAnswer}
                    </span>
                    {!isCorrect && (
                      <>
                        {" · "}Correta:{" "}
                        <span className="text-emerald-500 font-semibold">
                          {q.correctAnswer}
                        </span>
                      </>
                    )}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </PageContainer>
  );
};

export default ExamResultView;
