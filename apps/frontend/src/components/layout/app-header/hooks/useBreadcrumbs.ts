import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { PLANNING_TAB_LABELS } from '../app-header.constants';
import type { Breadcrumb } from '../app-header.types';

export function useBreadcrumbs(): Breadcrumb[] {
  const location = useLocation();
  const queryClient = useQueryClient();

  const pathIds = useMemo(() => {
    const path = location.pathname;
    const nbMatch = path.match(/\/notebooks\/([^/]+)/);
    const lfMatch = path.match(/\/notebooks\/([^/]+)\/leaves\/([^/]+)/);
    return {
      notebookId: nbMatch?.[1] || null,
      leafId: lfMatch?.[2] || null,
    };
  }, [location.pathname]);

  const notebookName = useMemo(() => {
    if (!pathIds.notebookId) return null;
    const cached = queryClient.getQueryData<{ title?: string }>(['notebooks', pathIds.notebookId]);
    return cached?.title ?? null;
  }, [pathIds.notebookId, queryClient]);

  const leafName = useMemo(() => {
    if (!pathIds.leafId) return null;
    const cached = queryClient.getQueryData<{ title?: string }>(['leaves', pathIds.leafId]);
    return cached?.title ?? null;
  }, [pathIds.leafId, queryClient]);

  return useMemo(() => {
    const path = location.pathname;
    const parts: Breadcrumb[] = [];

    if (path === '/dashboard' || path === '/') return [];

    if (path.includes('/friends') || path === '/friends') {
      parts.push({ label: 'Amigos', path: '/friends' });
      return parts;
    }
    if (path.includes('/shared') || path === '/shared') {
      parts.push({ label: 'Compartilhados', path: '/shared' });
      return parts;
    }

    parts.push({ label: 'Cadernos', path: '/dashboard' });

    if (pathIds.notebookId) {
      parts.push({
        label: notebookName || 'Caderno',
        path: `/notebooks/${pathIds.notebookId}`,
      });
    }
    if (pathIds.leafId) {
      parts.push({
        label: leafName || 'Folha',
        path: `/notebooks/${pathIds.notebookId}/leaves/${pathIds.leafId}`,
      });
    }
    if (path.includes('/study')) parts.push({ label: 'Estudar', path });
    if (path.includes('/tags')) parts.push({ label: 'Tags', path: '/tags' });
    if (path.includes('/bookmarks')) parts.push({ label: 'Marcadores', path: '/bookmarks' });
    if (path.includes('/trash')) parts.push({ label: 'Lixeira', path: '/trash' });
    if (path.includes('/archived')) parts.push({ label: 'Arquivados', path: '/archived' });
    if (path.includes('/todos')) parts.push({ label: 'Tarefas', path: '/todos' });
    if (path.includes('/planning')) {
      const tabMatch = path.match(/\/planning\/(\w+)/);
      const tabLabel = tabMatch && PLANNING_TAB_LABELS[tabMatch[1]]
        ? PLANNING_TAB_LABELS[tabMatch[1]]
        : 'Planejamento';
      parts.push({ label: tabLabel, path });
    }
    if (path.includes('/studies')) {
      if (path === '/studies') parts.push({ label: 'Estudos', path: '/studies' });
      else if (path.includes('flashcards')) parts.push({ label: 'Flashcards', path: '/studies/flashcards' });
      else if (path.includes('questions')) parts.push({ label: 'Questões', path: '/studies/questions' });
      else if (path.includes('mock-exams')) parts.push({ label: 'Simulados', path: '/studies/mock-exams' });
      else if (path.includes('reviews')) parts.push({ label: 'Revisões', path: '/studies/reviews' });
    }

    return parts;
  }, [location.pathname, pathIds, notebookName, leafName]);
}
