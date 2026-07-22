import React, { useState } from "react";
import { ArrowLeft, Timer, HelpCircle } from "lucide-react";
import { PageContainer } from "../../../components/ui/PageContainer.tsx";
import { Card } from "../../../components/ui/Card.tsx";
import { Button } from "../../../components/ui/Button.tsx";
import { QuestionOption } from "../../../components/ui/QuestionOption.tsx";
import type { MockExam } from "../types";

interface ExamTakingViewProps {
  exam: MockExam;
  answers: Record<string, string>;
  setAnswers: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  onFinish: () => void;
  onBack: () => void;
}

export const ExamTakingView: React.FC<ExamTakingViewProps> = ({
  exam,
  answers,
  setAnswers,
  onFinish,
  onBack,
}) => {
  const [questionIndex, setQuestionIndex] = useState(0);
  const questions = exam.questions?.map((eq) => eq.question) || [];
  const currentQuestion = questions[questionIndex];
  const isLast = questionIndex >= questions.length - 1;
  const answered = Object.keys(answers).length;

  const handleSelect = (option: string) => {
    if (!currentQuestion) return;
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: option }));
  };

  const handleNext = () => {
    if (isLast) {
      onFinish();
    } else {
      setQuestionIndex((prev) => prev + 1);
    }
  };

  if (questions.length === 0) {
    return (
      <PageContainer>
        <Card className="p-8 text-center">
          <p className="text-slate-500">Este simulado não possui questões.</p>
          <Button onClick={onBack} className="mt-4">Voltar</Button>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-dark-300 hover:text-brand-500 transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" /> Sair do Simulado
        </button>
        <div className="flex items-center gap-2 text-sm text-slate-400 dark:text-dark-500">
          <Timer className="h-4 w-4" />
          {exam.timeLimit && <span>{exam.timeLimit} min</span>}
          <span className="ml-2 font-bold text-slate-600 dark:text-dark-300">
            {questionIndex + 1}/{questions.length}
          </span>
        </div>
      </div>

      <div className="w-full h-2 bg-slate-100 dark:bg-dark-900 rounded-full overflow-hidden">
        <div
          className="h-full bg-amber-500 transition-all duration-300"
          style={{ width: `${(answered / questions.length) * 100}%` }}
        />
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-1.5 text-amber-500 text-xs font-bold tracking-wider uppercase mb-4">
          <HelpCircle className="h-4 w-4" /> Questão {questionIndex + 1}
        </div>
        <p className="text-lg font-heading font-semibold text-slate-800 dark:text-dark-50 leading-relaxed mb-6">
          {currentQuestion?.question}
        </p>

        <QuestionOption
          options={currentQuestion?.options || "[]"}
          selectedOption={answers[currentQuestion?.id || ""] || null}
          colorTheme="amber"
          onSelect={handleSelect}
        />

        <div className="mt-6 flex justify-between items-center">
          <span className="text-xs text-slate-400 dark:text-dark-500">
            {answered} de {questions.length} respondidas
          </span>
          <Button
            onClick={handleNext}
            disabled={!answers[currentQuestion?.id || ""]}
          >
            {isLast ? "Finalizar" : "Próxima"}
          </Button>
        </div>
      </Card>
    </PageContainer>
  );
};

export default ExamTakingView;
