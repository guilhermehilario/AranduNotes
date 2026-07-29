import type { ComponentType } from "react";

export interface NavItemConfig {
  path: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
}

export interface PlanningSubItem {
  path: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
}

export interface SidebarNavLinkProps {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  isActive: boolean;
  collapsed: boolean;
  onClick?: () => void;
  className?: string;
}

export interface SidebarBrandProps {
  collapsed: boolean;
  onClose: () => void;
}

export interface PlanningFlyoutProps {
  isOpen: boolean;
  flyoutStyle: React.CSSProperties;
  flyoutRef: React.RefObject<HTMLDivElement | null>;
  subItems: PlanningSubItem[];
  activePath: string;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onItemClick: () => void;
}

import type { Dispatch, SetStateAction } from "react";

export interface UsePlanningFlyoutReturn {
  planningFlyoutOpen: boolean;
  setPlanningFlyoutOpen: Dispatch<SetStateAction<boolean>>;
  flyoutHover: boolean;
  setFlyoutHover: Dispatch<SetStateAction<boolean>>;
  planningBtnRef: React.RefObject<HTMLButtonElement | null>;
  flyoutRef: React.RefObject<HTMLDivElement | null>;
  flyoutStyle: React.CSSProperties;
  showFlyout: boolean;
  updateFlyoutPosition: () => void;
  handlePlanningMouseLeave: () => void;
  handleFlyoutMouseEnter: () => void;
}
