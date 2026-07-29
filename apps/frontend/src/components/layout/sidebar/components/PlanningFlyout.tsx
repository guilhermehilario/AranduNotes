import React from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import type { PlanningFlyoutProps } from "../sidebar.types";

/**
 * PlanningFlyout — Flyout flutuante renderizado via portal no <body>
 * para exibir os sub-itens do Planejamento quando a sidebar está colapsada.
 *
 * O portal evita que o conteúdo seja cortado pelo overflow-y-auto da nav.
 */
export const PlanningFlyout: React.FC<PlanningFlyoutProps> = ({
  isOpen,
  flyoutStyle,
  flyoutRef,
  subItems,
  activePath,
  onMouseEnter,
  onMouseLeave,
  onItemClick,
}) => {
  if (!isOpen) return null;

  return createPortal(
    <div
      ref={flyoutRef}
      className="fixed z-[100] transition-all duration-200"
      style={flyoutStyle}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700 rounded-xl shadow-lg p-2 min-w-[180px]">
        <div className="flex flex-col gap-0.5">
          {subItems.map((item) => {
            const SubIcon = item.icon;
            const isSubActive = activePath === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onItemClick}
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
      </div>
    </div>,
    document.body,
  );
};

export default PlanningFlyout;
