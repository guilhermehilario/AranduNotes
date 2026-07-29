import React from "react";
import { Link } from "react-router-dom";
import type { SidebarNavLinkProps } from "../sidebar.types";

/**
 * SidebarNavLink — Item de navegação único da sidebar.
 *
 * Adapta-se automaticamente ao estado colapsado:
 * - Colapsado: apenas o ícone centralizado
 * - Expandido: ícone + label + background de destaque se ativo
 */
export const SidebarNavLink: React.FC<SidebarNavLinkProps> = ({
  to,
  icon: Icon,
  label,
  isActive,
  collapsed,
  onClick,
  className = "",
}) => {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center gap-3.5 px-3.5 py-3 rounded-xl font-medium transition-all duration-200 select-none ${
        collapsed ? "justify-center" : ""
      } ${
        isActive
          ? "bg-brand-500 text-white shadow-md shadow-brand-500/10"
          : "text-slate-650 hover:bg-slate-100 dark:text-dark-300 dark:hover:bg-dark-800/60"
      } ${className}`}
    >
      <Icon className="h-5 w-5 flex-shrink-0" />
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  );
};

export default SidebarNavLink;
