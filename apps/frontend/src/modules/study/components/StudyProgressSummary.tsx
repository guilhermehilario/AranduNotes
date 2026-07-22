import React from "react";
import {
  Brain,
  BookCheck,
  Target,
  BarChart3,
} from "lucide-react";
import { useStudyStats } from "../hooks/useStudyStats";
import { Card } from "../../../components/ui/Card.tsx";
import { EmptyState } from "../../../components/ui/EmptyState.tsx";
import { StatCard } from "../../../components/ui/StatCard.tsx";
import { MiniProgressRing } from "../../../components/ui/MiniProgressRing.tsx";
import { ProgressBar } from "../../../components/ui/ProgressBar.tsx";
import { Tooltip } from "../../../components/ui/Tooltip.tsx";
import { StatsSkeleton } from "./StatsSkeleton.tsx";

export const StudyProgressSummary: React.FC = () => {
  const { data: stats, isLoading } = useStudyStats();

  if (isLoading) {
    return <StatsSkeleton />;
  }

  if (!stats || stats.totalCards === 0) {
    return (
      <Card className="p-5 bg-gradient-to-br from-slate-50 to-white dark:from-dark-900 dark:to-dark-950 border border-slate-100 dark:border-dark-800">
        <EmptyState
          icon={<BarChart3 className="h-6 w-6" />}
          title="Nenhum estudo registrado ainda"
          description="Gere flashcards em suas folhas de anotação para começar a estudar e acompanhar seu progresso aqui."
        />
      </Card>
    );
  }

  const reviewedPct =
    stats.totalCards > 0
      ? Math.round((stats.reviewedToday / stats.totalCards) * 100)
      : 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Brain className="h-5 w-5" />}
          label="Total de Cards"
          value={stats.totalCards}
          sublabel={`${stats.dueForReview} pendentes para revisão`}
          colorClass="text-brand-500"
          iconBgClass="bg-brand-50 dark:bg-brand-950/20"
          tooltip="Quanto mais flashcards você criar, melhor será sua revisão. Tente gerar ao menos 5 cards por folha de anotação para fixar o conteúdo."
        />

        <StatCard
          icon={<BookCheck className="h-5 w-5" />}
          label="Revisados Hoje"
          value={stats.reviewedToday}
          sublabel={
            reviewedPct > 0
              ? `${reviewedPct}% do total`
              : "Nenhum card revisado hoje"
          }
          colorClass="text-emerald-500"
          iconBgClass="bg-emerald-50 dark:bg-emerald-950/20"
          tooltip="A consistência diária é o segredo da memorização de longo prazo. O ideal é revisar pelo menos 20-30 cards por dia para manter o ciclo SM-2 ativo."
        />

        <StatCard
          icon={<Target className="h-5 w-5" />}
          label="A Revisar"
          value={stats.dueForReview}
          sublabel={
            stats.dueForReview > 0
              ? "Cards atrasados ou pendentes"
              : "Tudo em dia!"
          }
          colorClass="text-amber-500"
          iconBgClass="bg-amber-50 dark:bg-amber-950/20"
          tooltip="Cards acumulados podem sobrecarregar sua sessão de estudo. Priorize revisar os pendentes antes de criar novos flashcards."
        />

        <Tooltip
          content="Quanto maior a taxa de acerto, melhor o momento da revisão. Acima de 80% é o ideal — significa que o SM-2 está espaçando corretamente."
          position="top"
        >
          <div className="flex items-center gap-3.5 p-4 bg-white dark:bg-dark-900 rounded-2xl border border-slate-100 dark:border-dark-800 shadow-sm transition-all duration-200 hover:shadow-md hover:border-slate-200 dark:hover:border-dark-700 cursor-help">
            <MiniProgressRing value={stats.accuracyRate} />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-slate-400 dark:text-dark-400 uppercase tracking-wide truncate">
                Taxa de Acerto
              </p>
              <p className="text-xl font-heading font-extrabold text-slate-800 dark:text-dark-50 mt-0.5">
                {stats.accuracyRate}%
              </p>
              <p className="text-[11px] text-slate-400 dark:text-dark-500 mt-0.5 truncate">
                Baseado no algoritmo SM-2
              </p>
            </div>
          </div>
        </Tooltip>
      </div>

      {/* Per-Notebook Breakdown */}
      {stats.perNotebook.length > 0 && (
        <div className="flex flex-col gap-2.5">
          <p className="text-xs font-bold text-slate-400 dark:text-dark-400 uppercase tracking-wide">
            Por Caderno
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {stats.perNotebook.map((nb) => {
              return (
                <div
                  key={nb.notebookId}
                  className="flex items-center gap-3 p-3 bg-white dark:bg-dark-900 rounded-xl border border-slate-100 dark:border-dark-800 hover:border-slate-200 dark:hover:border-dark-700 transition-all"
                >
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: nb.notebookColor }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-700 dark:text-dark-200 truncate">
                      {nb.notebookTitle}
                    </p>
                    <ProgressBar
                      value={nb.reviewedToday}
                      max={nb.totalCards}
                      showLabel
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudyProgressSummary;
