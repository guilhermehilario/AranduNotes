import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Brain,
  ClipboardList,
  Timer,
  BookOpen,
  RefreshCw,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import notebookService from "../../notebooks/services/notebookService";
import { studyService } from "../services/studyService";
import { PageContainer } from "../../../components/ui/PageContainer.tsx";
import { Card } from "../../../components/ui/Card.tsx";
import { StatCard } from "../../../components/ui/StatCard.tsx";

type StudyMode = "flashcards" | "questoes" | "simulados" | "revisoes";
type TabMode = "geral" | "por-materia";

interface StudyModeCardData {
  id: StudyMode;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  count?: number;
}

const STUDY_MODES: StudyModeCardData[] = [
  {
    id: "flashcards",
    title: "Flashcards",
    description: "Revise com repetição espaçada (SM-2)",
    icon: Brain,
    color: "text-brand-500",
    bgColor: "bg-brand-50 dark:bg-brand-950/20",
  },
  {
    id: "questoes",
    title: "Questões",
    description: "Perguntas de múltipla escolha e mais",
    icon: ClipboardList,
    color: "text-emerald-500",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/20",
  },
  {
    id: "simulados",
    title: "Simulados",
    description: "Testes cronometrados com questões",
    icon: Timer,
    color: "text-amber-500",
    bgColor: "bg-amber-50 dark:bg-amber-950/20",
  },
  {
    id: "revisoes",
    title: "Revisões",
    description: "Revisão geral de conteúdo pendente",
    icon: BookOpen,
    color: "text-rose-500",
    bgColor: "bg-rose-50 dark:bg-rose-950/20",
  },
];

export const EstudosView: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabMode>("geral");
  const [selectedNotebook, setSelectedNotebook] = useState<string | null>(null);

  const { data: notebooks = [], isLoading: notebooksLoading } = useQuery({
    queryKey: ["notebooks"],
    queryFn: notebookService.getNotebooks,
    staleTime: 30_000,
  });

  const { data: studyContent, isLoading: contentLoading } = useQuery({
    queryKey: ["studies", "content", selectedNotebook],
    queryFn: () => studyService.getContent(selectedNotebook || undefined),
    staleTime: 30_000,
  });

  const { data: stats } = useQuery({
    queryKey: ["studies", "stats"],
    queryFn: studyService.getDashboardStats,
    staleTime: 30_000,
  });

  const modeCards = useMemo((): StudyModeCardData[] => {
    return STUDY_MODES.map((mode) => {
      let count: number | undefined;
      if (mode.id === "flashcards") count = studyContent?.totalFlashcards;
      if (mode.id === "questoes") count = studyContent?.totalQuestions;
      if (mode.id === "simulados") count = studyContent?.totalMockExams;
      if (mode.id === "revisoes") {
        count = (studyContent?.flashcardsDue?.length ?? 0) + (studyContent?.totalFlashcards ?? 0);
      }
      return { ...mode, count };
    });
  }, [studyContent]);

  const handleStartStudy = (mode: StudyMode) => {
    const notebookParam = selectedNotebook ? `?notebookId=${selectedNotebook}` : "";

    switch (mode) {
      case "flashcards":
        if (selectedNotebook) {
          navigate(`/notebooks/${selectedNotebook}/study`);
        } else {
          // Escolhe um caderno com flashcards para estudar
          navigate(`/studies/flashcards${notebookParam}`);
        }
        break;
      case "questoes":
        navigate(`/studies/questions${notebookParam}`);
        break;
      case "simulados":
        navigate(`/studies/mock-exams${notebookParam}`);
        break;
      case "revisoes":
        navigate(`/studies/reviews${notebookParam}`);
        break;
    }
  };

  const isLoading = notebooksLoading || contentLoading;

  if (notebooksLoading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <RefreshCw className="h-10 w-10 animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <PageContainer>
      {/* Header */}
      <p className="text-sm text-slate-500 dark:text-dark-400">
        Escolha como deseja estudar hoje
      </p>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard
            label="Flashcards"
            value={stats.totalFlashcards}
            icon={<Brain className="h-4 w-4" />}
            colorClass="text-brand-500"
            iconBgClass="bg-brand-50 dark:bg-brand-950/20"
            tooltip={stats.flashcardsDue > 0 ? `${stats.flashcardsDue} pendentes` : undefined}
          />
          <StatCard
            label="Questões"
            value={stats.totalQuestions}
            icon={<ClipboardList className="h-4 w-4" />}
            colorClass="text-emerald-500"
            iconBgClass="bg-emerald-50 dark:bg-emerald-950/20"
          />
          <StatCard
            label="Simulados"
            value={stats.totalMockExams}
            icon={<Timer className="h-4 w-4" />}
            colorClass="text-amber-500"
            iconBgClass="bg-amber-50 dark:bg-amber-950/20"
          />
          <StatCard
            label="Para Revisar"
            value={stats.flashcardsDue}
            icon={<BookOpen className="h-4 w-4" />}
            colorClass="text-rose-500"
            iconBgClass="bg-rose-50 dark:bg-rose-950/20"
          />
        </div>
      )}

      {/* Tab Selector: Geral / Por Matéria */}
      <div className="flex items-center gap-2 bg-slate-100 dark:bg-dark-900 rounded-xl p-1 w-fit">
        <button
          type="button"
          onClick={() => {
            setActiveTab("geral");
            setSelectedNotebook(null);
          }}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer ${
            activeTab === "geral"
              ? "bg-white dark:bg-dark-800 text-slate-800 dark:text-dark-50 shadow-sm"
              : "text-slate-500 dark:text-dark-400 hover:text-slate-700 dark:hover:text-dark-200"
          }`}
        >
          Estudar Tudo
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("por-materia")}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer ${
            activeTab === "por-materia"
              ? "bg-white dark:bg-dark-800 text-slate-800 dark:text-dark-50 shadow-sm"
              : "text-slate-500 dark:text-dark-400 hover:text-slate-700 dark:hover:text-dark-200"
          }`}
        >
          Por Matéria
        </button>
      </div>

      {/* Subject Selector (only when "Por Matéria") */}
      {activeTab === "por-materia" && (
        <div className="flex flex-wrap gap-2">
          {notebooks.map((nb) => (
            <button
              key={nb.id}
              type="button"
              onClick={() => setSelectedNotebook(nb.id === selectedNotebook ? null : nb.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer border ${
                selectedNotebook === nb.id
                  ? "bg-brand-500 text-white border-brand-500 shadow-md shadow-brand-500/10"
                  : "bg-white dark:bg-dark-900 text-slate-600 dark:text-dark-300 border-slate-200 dark:border-dark-700 hover:border-brand-300 dark:hover:border-brand-700"
              }`}
            >
              <span
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: nb.color }}
              />
              {nb.title}
            </button>
          ))}
          {notebooks.length === 0 && (
            <p className="text-sm text-slate-400 dark:text-dark-500">
              Nenhum caderno encontrado. Crie um caderno primeiro.
            </p>
          )}
        </div>
      )}

      {/* Study Mode Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {modeCards.map((mode) => {
          const Icon = mode.icon;
          return (
            <Card
              key={mode.id}
              className="p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group"
              onClick={() => handleStartStudy(mode.id)}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`w-12 h-12 rounded-xl ${mode.bgColor} flex items-center justify-center flex-shrink-0`}
                >
                  <Icon className={`h-6 w-6 ${mode.color}`} />
                </div>
                <div className="flex-grow min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-base font-heading font-bold text-slate-800 dark:text-dark-50">
                      {mode.title}
                    </h3>
                    {mode.count !== undefined && (
                      <span className="text-xs font-bold text-slate-400 dark:text-dark-500 flex-shrink-0">
                        {mode.count} {mode.count === 1 ? "item" : "itens"}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 dark:text-dark-400 mt-0.5">
                    {mode.description}
                  </p>
                  <div className="flex items-center gap-1 mt-3 text-xs font-semibold text-brand-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span>Iniciar</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Current content preview */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      ) : (selectedNotebook && studyContent) ? (
        <Card className="p-5">
          <h3 className="text-sm font-heading font-bold text-slate-800 dark:text-dark-50 mb-3">
            Conteúdo disponível nesta matéria
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="flex flex-col gap-0.5 p-3 rounded-lg bg-slate-50 dark:bg-dark-800/50">
              <span className="text-lg font-bold text-brand-500">{studyContent.totalFlashcards}</span>
              <span className="text-xs text-slate-500 dark:text-dark-400">Flashcards</span>
            </div>
            <div className="flex flex-col gap-0.5 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20">
              <span className="text-lg font-bold text-emerald-500">{studyContent.totalQuestions}</span>
              <span className="text-xs text-slate-500 dark:text-dark-400">Questões</span>
            </div>
            <div className="flex flex-col gap-0.5 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20">
              <span className="text-lg font-bold text-amber-500">{studyContent.totalMockExams}</span>
              <span className="text-xs text-slate-500 dark:text-dark-400">Simulados</span>
            </div>
            <div className="flex flex-col gap-0.5 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/20">
              <span className="text-lg font-bold text-rose-500">{studyContent.flashcardsDue.length}</span>
              <span className="text-xs text-slate-500 dark:text-dark-400">Pendentes</span>
            </div>
          </div>
        </Card>
      ) : null}
    </PageContainer>
  );
};

export default EstudosView;
