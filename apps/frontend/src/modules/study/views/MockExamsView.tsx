import React, { useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  RefreshCw,
  Timer,
  Clock,
  Play,
  Plus,
  X,
} from "lucide-react";
import { useMockExams, useDeleteMockExam } from "../hooks/useMockExams";
import { PageContainer } from "../../../components/ui/PageContainer.tsx";
import { Card } from "../../../components/ui/Card.tsx";
import { Button } from "../../../components/ui/Button.tsx";
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog.tsx";
import { ExamTakingView } from "../components/ExamTakingView";
import { ExamResultView } from "../components/ExamResultView";
import type { MockExam } from "../types";

export const MockExamsView: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const notebookId = searchParams.get("notebookId");
  const [examToDelete, setExamToDelete] = useState<string | null>(null);
  const [activeExam, setActiveExam] = useState<MockExam | null>(null);
  const [examAnswers, setExamAnswers] = useState<Record<string, string>>({});
  const [examStep, setExamStep] = useState<"list" | "taking" | "result">("list");

  const { data: exams = [], isLoading } = useMockExams(notebookId || undefined);
  const deleteExam = useDeleteMockExam();

  const handleStartExam = (exam: MockExam) => {
    setActiveExam(exam);
    setExamAnswers({});
    setExamStep("taking");
  };

  const handleFinishExam = () => {
    setExamStep("result");
  };

  const handleBackToExams = () => {
    setActiveExam(null);
    setExamAnswers({});
    setExamStep("list");
  };

  const handleDeleteExam = async () => {
    if (examToDelete) {
      await deleteExam.mutateAsync(examToDelete);
      setExamToDelete(null);
    }
  };

  if (isLoading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <RefreshCw className="h-10 w-10 animate-spin text-brand-500" />
      </div>
    );
  }

  // Taking an exam
  if (activeExam && examStep === "taking") {
    return (
      <ExamTakingView
        exam={activeExam}
        answers={examAnswers}
        setAnswers={setExamAnswers}
        onFinish={handleFinishExam}
        onBack={handleBackToExams}
      />
    );
  }

  // Exam result
  if (activeExam && examStep === "result") {
    return (
      <ExamResultView
        exam={activeExam}
        answers={examAnswers}
        onBack={() => {
          setActiveExam(null);
          setExamAnswers({});
          setExamStep("list");
        }}
        onRestart={() => {
          setExamAnswers({});
          setExamStep("taking");
        }}
      />
    );
  }

  return (
    <PageContainer>
      <div className="flex items-center justify-between">
        <Link
          to="/studies"
          className="flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-dark-300 hover:text-brand-500 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar aos Estudos
        </Link>
        <Button
          onClick={() => navigate("/studies")}
          variant="secondary"
          leftIcon={<Plus className="h-4 w-4" />}
        >
          Novo Simulado
        </Button>
      </div>

      <p className="text-sm text-slate-500 dark:text-dark-400">
        {notebookId ? "Simulados da matéria selecionada" : "Todos os simulados disponíveis"}
      </p>

      {exams.length === 0 ? (
        <Card className="p-8 text-center">
          <Timer className="h-12 w-12 mx-auto text-slate-300 dark:text-dark-600 mb-3" />
          <h3 className="text-lg font-heading font-bold text-slate-800 dark:text-dark-50 mb-1">
            Nenhum simulado disponível
          </h3>
          <p className="text-sm text-slate-500 dark:text-dark-400 mb-4">
            Crie questões primeiro, depois gere um simulado automaticamente a partir delas.
          </p>
          <Button onClick={() => navigate("/studies")}>
            Voltar
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {exams.map((exam) => (
            <Card key={exam.id} className="p-4 hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/20 flex items-center justify-center flex-shrink-0">
                    <Timer className="h-5 w-5 text-amber-500" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-heading font-bold text-slate-800 dark:text-dark-50 truncate">
                      {exam.title}
                    </h3>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-slate-400 dark:text-dark-500">
                        {exam._count?.questions || 0} questões
                      </span>
                      {exam.timeLimit && (
                        <span className="flex items-center gap-1 text-xs text-slate-400 dark:text-dark-500">
                          <Clock className="h-3 w-3" />
                          {exam.timeLimit} min
                        </span>
                      )}
                      {exam.notebook && (
                        <span
                          className="text-xs px-1.5 py-0.5 rounded"
                          style={{
                            backgroundColor: `${exam.notebook.color}15`,
                            color: exam.notebook.color,
                          }}
                        >
                          {exam.notebook.title}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    onClick={() => handleStartExam(exam)}
                    leftIcon={<Play className="h-4 w-4" />}
                    size="sm"
                  >
                    Iniciar
                  </Button>
                  <button
                    type="button"
                    onClick={() => setExamToDelete(exam.id)}
                    className="p-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={!!examToDelete}
        onClose={() => setExamToDelete(null)}
        onConfirm={handleDeleteExam}
        title="Excluir Simulado"
        message="Tem certeza que deseja excluir este simulado? Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        isLoading={deleteExam.isPending}
      />
    </PageContainer>
  );
};

export default MockExamsView;
