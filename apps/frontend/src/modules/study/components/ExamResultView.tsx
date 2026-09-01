import React, { useMemo, useState } from "react";
import { Timer, CheckCircle, ThumbsUp, ThumbsDown } from "lucide-react";
import { PageContainer } from "../../../components/ui/PageContainer.tsx";
import { Card } from "../../../components/ui/Card.tsx";
import { Button } from "../../../components/ui/Button.tsx";
import type { MockExam } from "../types";

interface ExamResultViewProps {
  exam: MockExam;
  answers: Record<string, string>;
  onBack: (selfGrades: Record<string, boolean>) => void;
  onRestart: () => void;
}

export const ExamResultView: React.FC<ExamResultViewProps> = ({
  exam,
  answers,
  onBack,
  onRestart,
}) => {
  const questions = useMemo(
    () => exam.questions?.map((eq) => eq.question) || [],
    [exam.questions],
  );
  const total = questions.length;
  const [selfGrades, setSelfGrades] = useState<Record<string, boolean>>({});

  const correctCount = useMemo(
    () =>
      questions.filter((q) => {
        if (q.questionType === "dissertative") {
          return selfGrades[q.id] === true;
        }
        return answers[q.id] === q.correctAnswer;
      }).length,
    [questions, answers, selfGrades],
  );
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
          <Button onClick={() => onBack(selfGrades)} variant="secondary">
            Voltar
          </Button>
          <Button onClick={onRestart}>Refazer</Button>
        </div>
      </Card>

      <div className="flex flex-col gap-2">
        {questions.map((q, idx) => {
          const userAnswer = answers[q.id];
          const isDissertative = q.questionType === "dissertative";
          const isCorrect = isDissertative
            ? selfGrades[q.id] === true
            : userAnswer === q.correctAnswer;

          return (
            <Card key={q.id} className="p-4">
              <div className="flex items-start gap-3">
                <span
                  className={`text-lg font-bold flex-shrink-0 ${
                    isCorrect ? "text-emerald-500" : "text-rose-500"
                  }`}
                >
                  {isDissertative && selfGrades[q.id] === undefined
                    ? "?"
                    : isCorrect
                      ? "✓"
                      : "✗"}
                </span>
                <div className="min-w-0 flex-grow">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-xs font-bold text-slate-500 dark:text-dark-400">
                      {idx + 1}.
                    </span>
                    {isDissertative && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400">
                        Dissertativa
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-slate-800 dark:text-dark-50">
                    {q.question}
                  </p>

                  {isDissertative ? (
                    <div className="mt-2 flex flex-col gap-2">
                      <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-dark-800/50 border border-slate-100 dark:border-dark-700">
                        <p className="text-[11px] font-bold text-slate-400 dark:text-dark-500 mb-0.5">
                          Sua resposta
                        </p>
                        <p className="text-sm text-slate-700 dark:text-dark-200 whitespace-pre-wrap">
                          {userAnswer || <span className="italic text-slate-400">Sem resposta</span>}
                        </p>
                      </div>
                      <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40">
                        <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mb-0.5">
                          Resposta de referência
                        </p>
                        <p className="text-sm text-emerald-700 dark:text-emerald-300 whitespace-pre-wrap">
                          {q.correctAnswer}
                        </p>
                      </div>
                      {selfGrades[q.id] === undefined ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-500 dark:text-dark-400">
                            Avaliar:
                          </span>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() =>
                              setSelfGrades((prev) => ({ ...prev, [q.id]: true }))
                            }
                            leftIcon={<ThumbsUp className="h-3.5 w-3.5 text-emerald-500" />}
                          >
                            Acertei
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() =>
                              setSelfGrades((prev) => ({ ...prev, [q.id]: false }))
                            }
                            leftIcon={<ThumbsDown className="h-3.5 w-3.5 text-rose-500" />}
                          >
                            Errei
                          </Button>
                        </div>
                      ) : (
                        <p className="text-xs font-semibold text-slate-500 dark:text-dark-400">
                          Avaliação:{" "}
                          <span className={isCorrect ? "text-emerald-500" : "text-rose-500"}>
                            {isCorrect ? "Acertei" : "Errei"}
                          </span>
                        </p>
                      )}
                    </div>
                  ) : (
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
                  )}
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
