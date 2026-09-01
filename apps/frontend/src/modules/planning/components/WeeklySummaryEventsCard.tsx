import React from "react";
import { Link } from "react-router-dom";
import { Calendar } from "lucide-react";
import { Card } from "../../../components/ui/Card";
import type { PlanningEvent } from "../types";
import { formatDateShort } from "../../../utils/dateFormatUtils";

interface WeeklySummaryEventsCardProps {
  events: PlanningEvent[];
}

export const WeeklySummaryEventsCard: React.FC<WeeklySummaryEventsCardProps> = ({
  events,
}) => {
  if (events.length === 0) {
    return (
      <Card className="p-4 border border-slate-100 dark:border-dark-800">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-8 h-8 rounded-lg bg-violet-50 dark:bg-violet-950/20 flex items-center justify-center text-violet-500">
            <Calendar className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-heading font-bold text-slate-800 dark:text-dark-100">
              Eventos
            </h3>
            <p className="text-[11px] text-slate-400 dark:text-dark-400">
              {events.length} esta semana
            </p>
          </div>
        </div>
        <p className="text-xs text-slate-400 dark:text-dark-400 text-center py-3">
          Nenhum evento esta semana
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-4 border border-slate-100 dark:border-dark-800">
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-8 h-8 rounded-lg bg-violet-50 dark:bg-violet-950/20 flex items-center justify-center text-violet-500">
          <Calendar className="h-4 w-4" />
        </div>
        <div>
          <h3 className="text-sm font-heading font-bold text-slate-800 dark:text-dark-100">
            Eventos
          </h3>
          <p className="text-[11px] text-slate-400 dark:text-dark-400">
            {events.length} esta semana
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        {events.slice(0, 4).map((event) => (
          <div key={event.id} className="flex items-center gap-2 text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 flex-shrink-0" />
            <span className="flex-1 truncate text-slate-700 dark:text-dark-200 font-medium">
              {event.title}
            </span>
            <span className="text-slate-400 dark:text-dark-500 flex-shrink-0">
              {formatDateShort(event.date)}
            </span>
          </div>
        ))}
        {events.length > 4 && (
          <Link
            to="/planning/agenda"
            className="text-xs text-violet-500 hover:text-violet-600 font-semibold text-center pt-1"
          >
            +{events.length - 4} mais
          </Link>
        )}
      </div>
    </Card>
  );
};
