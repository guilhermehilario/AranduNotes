import React, { useState, useCallback } from 'react';
import {
  RefreshCw,
  CheckCircle,
  XCircle,
  HelpCircle,
  ChevronRight,
  ClipboardList,
  Shuffle,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useRandomQuestions } from '../hooks/useQuestions';
import { Card } from '../../../components/ui/Card.tsx';
import { Button } from '../../../components/ui/Button.tsx';
import { TextArea } from '../../../components/ui/TextArea.tsx';
import { QuestionOption } from '../../../components/ui/QuestionOption.tsx';
import type { Question } from '../types';

interface QuestionsPracticeProps {
  notebookId?: string;
  onGoToBank?: () => void;
}

export const QuestionsPractice: React.FC<QuestionsPracticeProps> = ({
  notebookId,
  onGoToBank,
}) => {
  const navigate = useNavigate();
  const { data: questions = [], isLoading } = useRandomQuestions(20, notebookId);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [textAnswer, setTextAnswer] = useState('');
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
    setTextAnswer('');
    setShowResult(false);
    setAnswers({});
  }, [questions]);

  const currentQuestion = questionsList[currentIndex];
  const isLastQuestion = currentIndex >= questionsList.length - 1;
  const isDissertative = currentQuestion?.questionType === 'dissertative';
  const correctCount = Object.values(answers).filter(Boolean).length;
  const totalAnswered = Object.keys(answers).length;

  const handleSelectOption = (option: string) => {
    if (showResult) return;
    setSelectedOption(option);
    setShowResult(true);
    const correct = option === currentQuestion?.correctAnswer;
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: correct }));
  };

  const handleTextSubmit = () => {
    if (!textAnswer.trim() || showResult) return;
    setShowResult(true);
  };

  const handleSelfGrade = (correct: boolean) => {
    if (!currentQuestion) return;
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: correct }));
  };

  const handleNext = () => {
    if (isLastQuestion) {
      return;
    }
    setCurrentIndex((prev) => prev + 1);
    setSelectedOption(null);
    setTextAnswer('');
    setShowResult(false);
  };

  const handleRestart = () => {
    setShuffledQuestions([...questions].sort(() => Math.random() - 0.5));
    setCurrentIndex(0);
    setSelectedOption(null);
    setTextAnswer('');
    setShowResult(false);
    setAnswers({});
  };

  if (isLoading) {
    return (
      <div className="h-[50vh] flex items-center justify-center">
        <RefreshCw className="h-10 w-10 animate-spin text-brand-500" />
      </div>
    );
  }

  // Tela inicial - antes de começar
  if (!sessionStarted) {
    return (
      <Card className="p-8 text-center">
        {questions.length === 0 ? (
          <>
            <ClipboardList className="h-12 w-12 mx-auto text-slate-300 dark:text-dark-600 mb-3" />
            <h3 className="text-lg font-heading font-bold text-slate-800 dark:text-dark-50 mb-1">
              Nenhuma questão disponível
            </h3>
            <p className="text-sm text-slate-500 dark:text-dark-400 mb-4">
              Crie questões no banco ou gere automaticamente a partir de flashcards.
            </p>
            {onGoToBank && (
              <Button onClick={onGoToBank} leftIcon={<Sparkles className="h-4 w-4" />}>
                Ir para o Banco de Questões
              </Button>
            )}
          </>
        ) : (
          <>
            <ClipboardList className="h-8 w-8 mx-auto text-emerald-500 mb-3" />
            <h3 className="text-lg font-heading font-bold text-slate-800 dark:text-dark-50 mb-1">
              Praticar Questões
            </h3>
            <p className="text-sm text-slate-500 dark:text-dark-400 mb-2">
              {questions.length} questões disponíveis
            </p>
            <p className="text-xs text-slate-400 dark:text-dark-500 mb-6">
              Apresentadas em ordem aleatória. Questões dissertativas são avaliadas
              por você (Acertei/Errei).
            </p>
            <Button onClick={startSession} leftIcon={<Shuffle className="h-4 w-4" />}>
              Começar
            </Button>
          </>
        )}
      </Card>
    );
  }

  // Tela de resultado final
  if (isLastQuestion && showResult && (selectedOption !== null || answers[currentQuestion.id] !== undefined)) {
    return (
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
          {totalAnswered > 0 ? ((correctCount / totalAnswered) * 100).toFixed(0) : '0'}% de acerto
        </p>
        <div className="flex items-center justify-center gap-3">
          <Button onClick={handleRestart} variant="secondary">
            Recomeçar
          </Button>
          <Button onClick={() => navigate('/studies')}>Outro Estudo</Button>
        </div>
      </Card>
    );
  }

  if (!currentQuestion) return null;

  const answeredCurrent =
    !isDissertative
      ? selectedOption !== null
      : answers[currentQuestion.id] !== undefined;

  const canProceed = isDissertative ? answeredCurrent : answeredCurrent && showResult;

  return (
    <>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-400 dark:text-dark-500">
          {correctCount}/{totalAnswered} corretas
        </span>
        <span className="text-sm font-bold text-slate-450 dark:text-dark-400">
          {currentIndex + 1} de {questionsList.length}
        </span>
      </div>

      <div className="w-full h-2 bg-slate-100 dark:bg-dark-900 rounded-full overflow-hidden">
        <div
          className="h-full bg-emerald-500 transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / questionsList.length) * 100}%` }}
        />
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-1.5 text-emerald-500 text-xs font-bold tracking-wider uppercase mb-4">
          <HelpCircle className="h-4 w-4" /> Questão {currentIndex + 1}
        </div>
        {currentQuestion.theme && (
          <span className="inline-block mb-3 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 dark:bg-dark-800 text-slate-600 dark:text-dark-300">
            {currentQuestion.theme}
          </span>
        )}
        <p className="text-lg font-heading font-semibold text-slate-800 dark:text-dark-50 leading-relaxed mb-6">
          {currentQuestion.question}
        </p>

        {isDissertative ? (
          <div className="flex flex-col gap-3">
            <TextArea
              label="Sua resposta"
              placeholder="Escreva sua resposta..."
              rows={4}
              value={textAnswer}
              disabled={showResult}
              onChange={(e) => setTextAnswer(e.target.value)}
            />
            {showResult ? (
              <>
                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40">
                  <p className="text-xs font-bold text-amber-600 dark:text-amber-400 mb-1">
                    Resposta de referência
                  </p>
                  <p className="text-sm text-slate-700 dark:text-dark-200 whitespace-pre-wrap">
                    {currentQuestion.correctAnswer}
                  </p>
                </div>
                {currentQuestion.explanation && (
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-dark-800/50 border border-slate-100 dark:border-dark-700">
                    <p className="text-xs font-bold text-slate-500 dark:text-dark-400 mb-1">
                      Explicação
                    </p>
                    <p className="text-sm text-slate-600 dark:text-dark-300">
                      {currentQuestion.explanation}
                    </p>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-600 dark:text-dark-300">
                    Como você se saiu?
                  </span>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleSelfGrade(true)}
                    disabled={answeredCurrent}
                    leftIcon={<ThumbsUp className="h-4 w-4 text-emerald-500" />}
                  >
                    Acertei
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleSelfGrade(false)}
                    disabled={answeredCurrent}
                    leftIcon={<ThumbsDown className="h-4 w-4 text-rose-500" />}
                  >
                    Errei
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex justify-end">
                <Button onClick={handleTextSubmit} disabled={!textAnswer.trim()}>
                  Responder
                </Button>
              </div>
            )}
          </div>
        ) : (
          <>
            <QuestionOption
              options={currentQuestion?.options || '[]'}
              selectedOption={selectedOption}
              correctAnswer={currentQuestion?.correctAnswer}
              showResult={showResult}
              colorTheme="emerald"
              onSelect={handleSelectOption}
            />
            {showResult && currentQuestion.explanation && (
              <div className="mt-4 p-3.5 rounded-xl bg-slate-50 dark:bg-dark-800/50 border border-slate-100 dark:border-dark-700">
                <p className="text-xs font-bold text-slate-500 dark:text-dark-400 mb-1">
                  Explicação
                </p>
                <p className="text-sm text-slate-600 dark:text-dark-300">
                  {currentQuestion.explanation}
                </p>
              </div>
            )}
          </>
        )}

        {canProceed && (
          <div className="mt-6 flex justify-end">
            <Button
              onClick={isLastQuestion ? handleRestart : handleNext}
              rightIcon={<ChevronRight className="h-4 w-4" />}
            >
              {isLastQuestion ? 'Ver Resultado' : 'Próxima'}
            </Button>
          </div>
        )}
      </Card>
    </>
  );
};

export default QuestionsPractice;