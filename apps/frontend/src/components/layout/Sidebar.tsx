import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useUIStore } from "../../store/uiStore";
import {
  Brain,
  BookOpen,
  BookmarkIcon,
  Archive,
  ListChecks,
  Tags,
  Trash2,
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  Calendar,
  CalendarDays,
  Timeline,
  Target,
  Timer,
  Settings,
  GraduationCap,
} from "lucide-react";

const DASHBOARD_PATH = "/dashboard";

const NAV_ITEMS = [
  { path: "/todos", label: "Tarefas", icon: ListChecks },
  { path: "/tags", label: "Tags", icon: Tags },
  { path: "/bookmarks", label: "Marcadores", icon: BookmarkIcon },
  { path: "/archived", label: "Arquivados", icon: Archive },
] as const;

const PLANNING_SUB_ITEMS = [
  { path: "/planning/agenda", label: "Agenda", icon: ListChecks },
  { path: "/planning/calendar", label: "Calendário", icon: CalendarDays },
  { path: "/planning/cronograma", label: "Cronograma", icon: Timeline },
  { path: "/planning/metas", label: "Metas", icon: Target },
  { path: "/planning/pomodoro", label: "Pomodoro", icon: Timer },
  { path: "/planning/settings", label: "Configurações", icon: Settings },
] as const;

export const Sidebar: React.FC = () => {
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const location = useLocation();

  const isTrashActive = location.pathname.startsWith("/trash");
  const isPlanningActive = location.pathname.startsWith("/planning");
  const [planningExpanded, setPlanningExpanded] = useState(isPlanningActive);

  // Auto-expand planning when navigating to a sub-item
  React.useEffect(() => {
    if (isPlanningActive) {
      setPlanningExpanded(true);
    }
  }, [isPlanningActive]);

  return (
    <aside
      className={`bg-white dark:bg-dark-900 border-r border-slate-100 dark:border-dark-800/80 flex flex-col transition-all duration-300 relative z-20 ${
        sidebarCollapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Header da Sidebar */}
      <div className="h-16 flex items-center justify-between px-3 border-b border-slate-50 dark:border-dark-800/60">
        <Link
          to="/dashboard"
          className="flex items-center gap-3 overflow-hidden select-none"
        >
          <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center shadow-md shadow-brand-500/20 flex-shrink-0">
            <Brain className="h-6 w-6 text-white" />
          </div>
          {!sidebarCollapsed && (
            <span className="font-heading font-extrabold text-lg tracking-tight whitespace-nowrap">
              Arandu
            </span>
          )}
        </Link>
      </div>

      {/* Links de Navegação */}
      <nav className="flex-grow py-6 px-3 flex flex-col gap-2 overflow-y-auto">
        {/* Dashboard (sempre no topo) */}
        <Link
          to={DASHBOARD_PATH}
          className={`flex items-center gap-3.5 px-3.5 py-3 rounded-xl font-medium transition-all duration-200 select-none ${
            sidebarCollapsed ? "justify-center" : ""
          } ${
            location.pathname === "/dashboard" ||
            location.pathname.startsWith("/notebooks/")
              ? "bg-brand-500 text-white shadow-md shadow-brand-500/10"
              : "text-slate-650 hover:bg-slate-100 dark:text-dark-300 dark:hover:bg-dark-800/60"
          }`}
        >
          <BookOpen className="h-5 w-5 flex-shrink-0" />
          {!sidebarCollapsed && <span className="truncate">Cadernos</span>}
        </Link>

        {/* ── Planejamento (expansível) ── */}
        {!sidebarCollapsed ? (
          <div className="flex flex-col gap-0.5">
            {/* Planning Header Button */}
            <button
              type="button"
              onClick={() => setPlanningExpanded(!planningExpanded)}
              className={`flex items-center gap-3.5 px-3.5 py-3 rounded-xl font-medium transition-all duration-200 select-none w-full text-left cursor-pointer ${
                sidebarCollapsed ? "justify-center" : ""
              } ${
                isPlanningActive
                  ? "bg-brand-500 text-white shadow-md shadow-brand-500/10"
                  : "text-slate-650 hover:bg-slate-100 dark:text-dark-300 dark:hover:bg-dark-800/60"
              }`}
            >
              <Calendar className="h-5 w-5 flex-shrink-0" />
              <span className="flex-1 truncate">Planejamento</span>
              {planningExpanded ? (
                <ChevronDown className="h-4 w-4 flex-shrink-0 opacity-60" />
              ) : (
                <ChevronRight className="h-4 w-4 flex-shrink-0 opacity-60" />
              )}
            </button>

            {/* Sub-items */}
            {planningExpanded && (
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
        ) : (
          /* Collapsed: just show the icon, no sub-items */
          <Link
            to="/planning/agenda"
            className={`flex items-center justify-center px-3.5 py-3 rounded-xl font-medium transition-all duration-200 select-none ${
              isPlanningActive
                ? "bg-brand-500 text-white shadow-md shadow-brand-500/10"
                : "text-slate-650 hover:bg-slate-100 dark:text-dark-300 dark:hover:bg-dark-800/60"
            }`}
          >
            <Calendar className="h-5 w-5 flex-shrink-0" />
          </Link>
        )}

        {/* ── Estudos (ícone único) ── */}
        <Link
          to="/studies"
          className={`flex items-center gap-3.5 px-3.5 py-3 rounded-xl font-medium transition-all duration-200 select-none ${
            sidebarCollapsed ? "justify-center" : ""
          } ${
            location.pathname.startsWith("/studies")
              ? "bg-brand-500 text-white shadow-md shadow-brand-500/10"
              : "text-slate-650 hover:bg-slate-100 dark:text-dark-300 dark:hover:bg-dark-800/60"
          }`}
        >
          <GraduationCap className="h-5 w-5 flex-shrink-0" />
          {!sidebarCollapsed && <span className="truncate">Estudos</span>}
        </Link>

        {/* Demais itens (Tags, Marcadores, Arquivados, Tarefas) */}
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname.startsWith(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3.5 px-3.5 py-3 rounded-xl font-medium transition-all duration-200 select-none ${
                sidebarCollapsed ? "justify-center" : ""
              } ${
                isActive
                  ? "bg-brand-500 text-white shadow-md shadow-brand-500/10"
                  : "text-slate-650 hover:bg-slate-100 dark:text-dark-300 dark:hover:bg-dark-800/60"
              }`}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {!sidebarCollapsed && (
                <span className="truncate">{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer da Sidebar */}
      <div className="p-3 border-t border-slate-50 dark:border-dark-800/60">
        {/* Botão Lixeira */}
        <Link
          to="/trash"
          className={`flex items-center gap-3.5 px-3.5 py-3 rounded-xl font-medium transition-all duration-200 select-none ${
            sidebarCollapsed ? "justify-center" : ""
          } ${
            isTrashActive
              ? "bg-brand-500 text-white shadow-md shadow-brand-500/10"
              : "text-slate-650 hover:bg-slate-100 dark:text-dark-300 dark:hover:bg-dark-800/60"
          }`}
        >
          <Trash2 className="h-5 w-5 flex-shrink-0" />
          {!sidebarCollapsed && <span className="truncate">Lixeira</span>}
        </Link>
      </div>

      {/* Toggle Collapse Button */}
      <button
        onClick={toggleSidebar}
        className="absolute bottom-20 right-[-14px] w-7 h-7 bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-full flex items-center justify-center hover:bg-slate-100 dark:hover:bg-dark-700 cursor-pointer shadow-sm text-slate-600 dark:text-dark-200"
      >
        {sidebarCollapsed ? (
          <ChevronLeft className="h-4 w-4 rotate-180" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </button>
    </aside>
  );
};

export default Sidebar;
