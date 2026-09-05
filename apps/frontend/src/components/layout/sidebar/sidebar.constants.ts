import {
  BookmarkIcon,
  Archive,
  ListChecks,
  Tags,
  Trash2,
  CalendarDays,
  Timeline,
  Target,
  Timer,
  Share2,
  Users,
} from "lucide-react";
import type { NavItemConfig, PlanningSubItem } from "./sidebar.types";

export const DASHBOARD_PATH = "/dashboard";

export const NAV_ITEMS: NavItemConfig[] = [
  { path: "/friends", label: "Amigos", icon: Users },
  { path: "/shared", label: "Compartilhados", icon: Share2 },
  { path: "/tags", label: "Tags", icon: Tags },
  { path: "/bookmarks", label: "Marcadores", icon: BookmarkIcon },
  { path: "/archived", label: "Arquivados", icon: Archive },
] as const;

export const PLANNING_SUB_ITEMS: PlanningSubItem[] = [
  { path: "/planning/agenda", label: "Agenda", icon: ListChecks },
  { path: "/planning/calendar", label: "Calendário", icon: CalendarDays },
  { path: "/planning/cronograma", label: "Cronograma", icon: Timeline },
  { path: "/planning/metas", label: "Metas", icon: Target },
  { path: "/planning/pomodoro", label: "Pomodoro", icon: Timer },
  { path: "/todos", label: "Tarefas", icon: ListChecks },
] as const;

export const TRASH_ITEM: NavItemConfig = {
  path: "/trash",
  label: "Lixeira",
  icon: Trash2,
};
