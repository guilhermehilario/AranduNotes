import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Calendar, ChevronDown, ChevronRight } from "lucide-react";
import { PLANNING_SUB_ITEMS } from "../sidebar.constants";

interface PlanningSectionProps {
  expanded: boolean;
  isActive: boolean;
  onToggle: () => void;
}

/**
 * PlanningSection — Seção de Planejamento com sub-itens expansíveis.
 * Usada quando a sidebar está no modo expandido.
 */
export const PlanningSection: React.FC<PlanningSectionProps> = ({
  expanded,
  isActive,
  onToggle,
}) => {
  const location = useLocation();

  return (
    <div className="flex flex-col gap-0.5">
      <button
        type="button"
        onClick={onToggle}
        className={`flex items-center gap-3.5 px-3.5 py-3 rounded-xl font-medium transition-all duration-200 select-none w-full text-left cursor-pointer ${
          isActive
            ? "bg-brand-500 text-white shadow-md shadow-brand-500/10"
            : "text-slate-650 hover:bg-slate-100 dark:text-dark-300 dark:hover:bg-dark-800/60"
        }`}
      >
        <Calendar className="h-5 w-5 flex-shrink-0" />
        <span className="flex-1 truncate">Planejamento</span>
        {expanded ? (
          <ChevronDown className="h-4 w-4 flex-shrink-0 opacity-60" />
        ) : (
          <ChevronRight className="h-4 w-4 flex-shrink-0 opacity-60" />
        )}
      </button>

      {expanded && (
        <div className="flex flex-col gap-0.5 ml-2 pl-3.5 border-l-2 border-slate-100 dark:border-dark-800">
          {PLANNING_SUB_ITEMS.map((item) => {
            const SubIcon = item.icon;
            const isSubActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 select-none ${
                  isSubActive
                    ? "bg-brand-100 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-50 dark:text-dark-400 dark:hover:text-dark-200 dark:hover:bg-dark-800/40"
                }`}
              >
                <SubIcon className="h-5 w-5 flex-shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PlanningSection;
