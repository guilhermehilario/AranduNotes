import React from "react";
import { Link } from "react-router-dom";
import { Brain, X } from "lucide-react";
import type { SidebarBrandProps } from "../sidebar.types";

/**
 * SidebarBrand — Cabeçalho da sidebar com o logotipo Arandu
 * e botão de fechar para o drawer mobile.
 */
export const SidebarBrand: React.FC<SidebarBrandProps> = ({
  collapsed,
  onClose,
}) => {
  return (
    <div className="h-16 flex items-center justify-between px-3 border-b border-slate-50 dark:border-dark-800/60">
      <Link
        to="/dashboard"
        className="flex items-center gap-3 overflow-hidden select-none"
        onClick={onClose}
      >
        <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center shadow-md shadow-brand-500/20 flex-shrink-0">
          <Brain className="h-6 w-6 text-white" />
        </div>
        {!collapsed && (
          <span className="font-heading font-extrabold text-lg tracking-tight whitespace-nowrap">
            Arandu
          </span>
        )}
      </Link>
      {/* Close button for mobile — hidden when collapsed so it doesn't overlap the icon */}
      <button
        onClick={onClose}
        className={`p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-dark-800 text-slate-500 dark:text-dark-300 ${
          collapsed ? "hidden" : "lg:hidden"
        }`}
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  );
};

export default SidebarBrand;
