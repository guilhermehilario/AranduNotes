import React, { useState, useCallback } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  RefreshCw,
  CheckCircle,
  XCircle,
  HelpCircle,
  ChevronRight,
  ClipboardList,
  Shuffle,
} from "lucide-react";
import { useRandomQuestions } from "../hooks/useQuestions";
import { PageContainer } from "../../../components/ui/PageContainer.tsx";
import { Card } from "../../../components/ui/Card.tsx";
import { Button } from "../../../components/ui/Button.tsx";
import { QuestionOption } from "../../../components/ui/QuestionOption.tsx";
import type { Question } from "../types";

export const QuestionsStudyView: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const notebookId = searchParams.get("notebookId");

  const { data: questions = [], isLoading } = useRandomQuestions(20, notebookId || undefined);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [shuffledQuestions, setShuffledQuestions] = useState<Question[]>([]);
  const [sessionStarted, setSessionStarted] = useState(false);

  const questionsList = shuffledQuestions.length > 0 ? shuffledQuestions : questions;

  const startSession = useCallback(() => {
    setShuffledQuestions([...questions].sort(() => Math.random() - 0.5));
    setSessionStarted(true);
    setCurrentIndex(0);
    setSelectedOption(null);
    setShowResult(false);
    setAnswers({});
  }, [questions]);

  const currentQuestion = questionsList[currentIndex];
  const isLastQuestion = currentIndex >= questionsList.length - 1;
  const correctCount = Object.values(answers).filter(Boolean).length;
  const totalAnswered = Object.keys(answers).length;

  const handleSelectOption = (option: string) => {
    if (showResult) return;
    setSelectedOption(option);
    setShowResult(true);

    const correct = option === currentQuestion?.correctAnswer;
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: correct }));
  };

  const handleNext = () => {
    if (isLastQuestion) {
      // Session finished
      return;
    }
    setCurrentIndex((prev) => prev + 1);
    setSelectedOption(null);
    setShowResult(false);
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setShowResult(false);
    setAnswers({});
    setShuffledQuestions([...questions].sort(() => Math.random() - 0.5));
  };

  if (isLoading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <RefreshCw className="h-10 w-10 animate-spin text-brand-500" />
      </div>
    );
  }

  // Tela inicial - antes de começar
  if (!sessionStarted) {
    return (
      <PageContainer>
        <Link
          to="/studies"
          className="flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-dark-300 hover:text-brand-500 transition-colors w-fit"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar aos Estudos
        </Link>

        {questions.length === 0 ? (
          <Card className="p-8 text-center">
            <ClipboardList className="h-12 w-12 mx-auto text-slate-300 dark:text-dark-600 mb-3" />
            <h3 className="text-lg font-heading font-bold text-slate-800 dark:text-dark-50 mb-1">
              Nenhuma questão disponível
            </h3>
            <p className="text-sm text-slate-500 dark:text-dark-400 mb-4">
              Crie questões nos seus cadernos ou gere automaticamente a partir de flashcards.
            </p>
            <Button onClick={() => navigate("/studies")}>
              Voltar
            </Button>
          </Card>
        ) : (
          <Card className="p-8 text-center">
            <ClipboardList className="h-8 w-8 mx-auto text-emerald-500 mb-3" />
            <h3 className="text-lg font-heading font-bold text-slate-800 dark:text-dark-50 mb-1">
              Praticar Questões
            </h3>
            <p className="text-sm text-slate-500 dark:text-dark-400 mb-2">
              {questions.length} questões disponíveis
            </p>
            <p className="text-xs text-slate-400 dark:text-dark-500 mb-6">
              Serão apresentadas em ordem aleatória. Escolha a resposta correta para cada uma.
            </p>
            <Button onClick={startSession} leftIcon={<Shuffle className="h-4 w-4" />}>
              Começar
            </Button>
          </Card>
        )}
      </PageContainer>
    );
  }

  // Tela de resultado final
  if (isLastQuestion && showResult && selectedOption !== null) {
    return (
      <PageContainer>
        <Link
          to="/studies"
          className="flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-dark-300 hover:text-brand-500 transition-colors w-fit"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar aos Estudos
        </Link>

        <Card className="p-8 text-center">
          <div className="flex items-center justify-center mb-4">
            {correctCount === totalAnswered ? (
              <CheckCircle className="h-16 w-16 text-emerald-500" />
            ) : correctCount >= totalAnswered / 2 ? (
              <HelpCircle className="h-16 w-16 text-amber-500" />
            ) : (
              <XCircle className="h-16 w-16 text-rose-500" />
            )}
          </div>
          <h3 className="text-2xl font-heading font-bold text-slate-800 dark:text-dark-50 mb-2">
            Resultado
          </h3>
          <p className="text-4xl font-bold text-brand-500 mb-1">
            {correctCount}/{totalAnswered}
          </p>
          <p className="text-sm text-slate-500 dark:text-dark-400 mb-6">
            {((correctCount / totalAnswered) * 100).toFixed(0)}% de acerto
          </p>
          <div className="flex items-center justify-center gap-3">
            <Button onClick={handleRestart} variant="secondary">
              Recomeçar
            </Button>
            <Button onClick={() => navigate("/studies")}>
              Outro Estudo
            </Button>
          </div>
        </Card>
      </PageContainer>
    );
  }

  if (!currentQuestion) return null;

  return (
    <PageContainer>
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/studies"
          className="flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-dark-300 hover:text-brand-500 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-slate-400 dark:text-dark-500">
            {correctCount}/{totalAnswered} corretas
          </span>
          <span className="text-sm font-bold text-slate-450 dark:text-dark-400">
            {currentIndex + 1} de {questionsList.length}
          </span>
        </div>
      </div>

      {/* Progress */}
      <div className="w-full h-2 bg-slate-100 dark:bg-dark-900 rounded-full overflow-hidden">
        <div
          className="h-full bg-emerald-500 transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / questionsList.length) * 100}%` }}
        />
      </div>

      {/* Question Card */}
      <Card className="p-6">
        <div className="flex items-center gap-1.5 text-emerald-500 text-xs font-bold tracking-wider uppercase mb-4">
          <HelpCircle className="h-4 w-4" /> Questão {currentIndex + 1}
        </div>
        <p className="text-lg font-heading font-semibold text-slate-800 dark:text-dark-50 leading-relaxed mb-6">
          {currentQuestion.question}
        </p>

        {/* Options */}
        <QuestionOption
          options={currentQuestion?.options || "[]"}
          selectedOption={selectedOption}
          correctAnswer={currentQuestion?.correctAnswer}
          showResult={showResult}
          colorTheme="emerald"
          onSelect={handleSelectOption}
        />

        {/* Explanation */}
        {showResult && currentQuestion.explanation && (
          <div className="mt-4 p-3.5 rounded-xl bg-slate-50 dark:bg-dark-800/50 border border-slate-100 dark:border-dark-700">
            <p className="text-xs font-bold text-slate-500 dark:text-dark-400 mb-1">Explicação</p>
            <p className="text-sm text-slate-600 dark:text-dark-300">
              {currentQuestion.explanation}
            </p>
          </div>
        )}

        {/* Next Button */}
        {showResult && (
          <div className="mt-6 flex justify-end">
            <Button
              onClick={isLastQuestion ? handleRestart : handleNext}
              rightIcon={<ChevronRight className="h-4 w-4" />}
            >
              {isLastQuestion ? "Ver Resultado" : "Próxima"}
            </Button>
          </div>
        )}
      </Card>
    </PageContainer>
  );
};

export default QuestionsStudyView;
