import React from 'react';
import {
  BookOpen,
  GraduationCap,
  BookmarkIcon,
  Tags,
  Trash2,
  Archive,
  ListChecks,
  Calendar,
  Users,
  Share2,
} from 'lucide-react';

export const PAGE_CONFIG: Record<string, { title: string; icon: React.ComponentType<{ className?: string }>; subtitle: string }> = {
  '/dashboard': { title: 'Cadernos', icon: BookOpen, subtitle: 'Gerencie seus materiais universitários e crie resumos de forma organizada' },
  '/study': { title: 'Estudar Flashcards', icon: GraduationCap, subtitle: 'Revise seus flashcards com repetição espaçada' },
  '/leaves/': { title: 'Editor de Anotação', icon: BookOpen, subtitle: 'Edite suas anotações' },
  '/tags': { title: 'Gerenciar Tags', icon: Tags, subtitle: 'Gerencie suas tags' },
  '/bookmarks': { title: 'Páginas Marcadas', icon: BookmarkIcon, subtitle: 'Acesse suas páginas favoritas' },
  '/trash': { title: 'Lixeira', icon: Trash2, subtitle: 'Itens excluídos aparecem aqui por 15 dias' },
  '/archived': { title: 'Arquivados', icon: Archive, subtitle: 'Folhas arquivadas' },
  '/todos': { title: 'Tarefas', icon: ListChecks, subtitle: 'Gerencie suas tarefas pendentes' },
  '/planning': { title: 'Planejamento', icon: Calendar, subtitle: 'Organize seus estudos' },
  '/studies': { title: 'Estudos', icon: GraduationCap, subtitle: 'Escolha como estudar hoje' },
  '/friends': { title: 'Amigos', icon: Users, subtitle: 'Gerencie seus amigos e convites' },
  '/shared': { title: 'Compartilhados', icon: Share2, subtitle: 'Conteúdo compartilhado com você' },
};

export const PLANNING_TAB_LABELS: Record<string, string> = {
  agenda: 'Agenda',
  calendar: 'Calendário',
  cronograma: 'Cronograma',
  metas: 'Metas',
  pomodoro: 'Pomodoro',
  settings: 'Configurações',
};

export const DEFAULT_PAGE = { title: 'Cadernos', icon: BookOpen, subtitle: 'Gerencie seus materiais universitários e crie resumos de forma organizada' };
