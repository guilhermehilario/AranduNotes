import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import {
  BookOpen,
  GraduationCap,
  ChevronLeft,
} from "lucide-react";
import { useUIStore } from "../../store/uiStore";

import { DASHBOARD_PATH, NAV_ITEMS, PLANNING_SUB_ITEMS, TRASH_ITEM } from "./sidebar/sidebar.constants";
import { usePlanningFlyout } from "./sidebar/hooks/usePlanningFlyout";
import { SidebarBrand } from "./sidebar/components/SidebarBrand";
import { SidebarNavLink } from "./sidebar/components/SidebarNavLink";
import { PlanningSection } from "./sidebar/components/PlanningSection";
import { PlanningCollapsedButton } from "./sidebar/components/PlanningCollapsedButton";
import { PlanningFlyout } from "./sidebar/components/PlanningFlyout";

const isPathActive = (path: string, currentPath: string) =>
  currentPath.startsWith(path);

export const Sidebar: React.FC = () => {
  const {
    sidebarCollapsed: rawCollapsed,
    toggleSidebar,
    mobileSidebarOpen,
    setMobileSidebarOpen,
  } = useUIStore();
  const location = useLocation();

  // No mobile drawer, a sidebar sempre abre expandida
  const sidebarCollapsed = rawCollapsed && !mobileSidebarOpen;

  const isTrashActive = location.pathname.startsWith("/trash");
  // Tarefas ficou sob o submenu de Planejamento
  const isPlanningActive =
    location.pathname.startsWith("/planning") ||
    location.pathname.startsWith("/todos");

  // null = auto (segue a rota), true = expandido, false = colapsado
  const [planningExpandedByUser, setPlanningExpandedByUser] = useState<boolean | null>(null);
  const planningExpanded = planningExpandedByUser ?? isPlanningActive;

  // Flyout para o modo colapsado
  const flyout = usePlanningFlyout();

  // Close mobile sidebar on route change
  React.useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location.pathname, setMobileSidebarOpen]);

  // Callback para fechar o flyout e o drawer mobile
  const closeAll = () => {
    flyout.setPlanningFlyoutOpen(false);
    flyout.setFlyoutHover(false);
    setMobileSidebarOpen(false);
  };

  const sidebarContent = (
    <aside
      className={`bg-white dark:bg-dark-900 border-r border-slate-100 dark:border-dark-800/80 flex flex-col flex-shrink-0 transition-all duration-300 z-20 h-full ${
        sidebarCollapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Header — logotipo + botão fechar */}
      <SidebarBrand
        collapsed={sidebarCollapsed}
        onClose={() => setMobileSidebarOpen(false)}
      />

      {/* Links de Navegação */}
      <nav className="flex-grow py-6 px-3 flex flex-col gap-2 overflow-y-auto">
        {/* Dashboard */}
        <SidebarNavLink
          to={DASHBOARD_PATH}
          icon={BookOpen}
          label="Cadernos"
          isActive={
            location.pathname === DASHBOARD_PATH ||
            location.pathname.startsWith("/notebooks/")
          }
          collapsed={sidebarCollapsed}
          onClick={closeAll}
        />

        {/* ── Planejamento ── */}
        {!sidebarCollapsed ? (
          <PlanningSection
            expanded={planningExpanded}
            isActive={isPlanningActive}
            onToggle={() => setPlanningExpandedByUser((prev) => prev === null ? !isPlanningActive : !prev)}
          />
        ) : (
          <>
            <PlanningCollapsedButton
              isActive={isPlanningActive}
              onClick={() => {
                flyout.updateFlyoutPosition();
                flyout.setPlanningFlyoutOpen((prev) => !prev);
              }}
              onMouseEnter={() => {
                flyout.updateFlyoutPosition();
                flyout.setFlyoutHover(true);
              }}
              onMouseLeave={flyout.handlePlanningMouseLeave}
              buttonRef={flyout.planningBtnRef}
            />
            <PlanningFlyout
              isOpen={flyout.showFlyout}
              flyoutStyle={flyout.flyoutStyle}
              flyoutRef={flyout.flyoutRef}
              subItems={PLANNING_SUB_ITEMS}
              activePath={location.pathname}
              onMouseEnter={flyout.handleFlyoutMouseEnter}
              onMouseLeave={() => {
                flyout.setFlyoutHover(false);
                if (!flyout.planningFlyoutOpen) flyout.setPlanningFlyoutOpen(false);
              }}
              onItemClick={closeAll}
            />
          </>
        )}

        {/* ── Estudos ── */}
        <SidebarNavLink
          to="/studies"
          icon={GraduationCap}
          label="Estudos"
          isActive={location.pathname.startsWith("/studies")}
          collapsed={sidebarCollapsed}
          onClick={closeAll}
        />

        {/* Demais itens (Tags, Marcadores, Arquivados) */}
        {NAV_ITEMS.map((item) => (
          <SidebarNavLink
            key={item.path}
            to={item.path}
            icon={item.icon}
            label={item.label}
            isActive={isPathActive(item.path, location.pathname)}
            collapsed={sidebarCollapsed}
            onClick={closeAll}
          />
        ))}
      </nav>

      {/* Footer — Lixeira */}
      <div className="p-3 border-t border-slate-50 dark:border-dark-800/60">
        <SidebarNavLink
          to={TRASH_ITEM.path}
          icon={TRASH_ITEM.icon}
          label={TRASH_ITEM.label}
          isActive={isTrashActive}
          collapsed={sidebarCollapsed}
          onClick={closeAll}
        />
      </div>

      {/* Toggle Collapse Button (apenas desktop) */}
      <button
        onClick={toggleSidebar}
        className="absolute bottom-20 right-[-14px] w-7 h-7 bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-full flex items-center justify-center hover:bg-slate-100 dark:hover:bg-dark-700 cursor-pointer shadow-sm text-slate-600 dark:text-dark-200 hidden lg:flex"
      >
        {sidebarCollapsed ? (
          <ChevronLeft className="h-4 w-4 rotate-180" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </button>
    </aside>
  );

  return (
    <>
      {/* Desktop sidebar - always visible */}
      <div className="hidden lg:flex relative">{sidebarContent}</div>

      {/* Mobile sidebar - overlay drawer */}
      <div className="lg:hidden">
        {mobileSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 transition-all duration-300"
            onClick={() => setMobileSidebarOpen(false)}
          />
        )}
        <div
          className={`fixed top-0 left-0 h-full z-40 transition-transform duration-300 ease-in-out ${
            mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {sidebarContent}
        </div>
      </div>
    </>
  );
};

export default Sidebar;
