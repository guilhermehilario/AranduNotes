import React from "react";
import { Calendar } from "lucide-react";

interface PlanningCollapsedButtonProps {
  isActive: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  buttonRef: React.RefObject<HTMLButtonElement | null>;
}

/**
 * PlanningCollapsedButton — Botão do Planejamento para o modo colapsado.
 * Ao clicar ou passar o mouse, abre o flyout com os sub-itens.
 */
export const PlanningCollapsedButton: React.FC<PlanningCollapsedButtonProps> = ({
  isActive,
  onClick,
  onMouseEnter,
  onMouseLeave,
  buttonRef,
}) => {
  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`flex items-center justify-center w-full px-3.5 py-3 rounded-xl font-medium transition-all duration-200 select-none cursor-pointer ${
        isActive
          ? "bg-brand-500 text-white shadow-md shadow-brand-500/10"
          : "text-slate-650 hover:bg-slate-100 dark:text-dark-300 dark:hover:bg-dark-800/60"
      }`}
    >
      <Calendar className="h-5 w-5 flex-shrink-0" />
    </button>
  );
};

export default PlanningCollapsedButton;
