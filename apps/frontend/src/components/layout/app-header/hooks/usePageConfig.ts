import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { PAGE_CONFIG, DEFAULT_PAGE } from '../app-header.constants';

export function usePageConfig() {
  const location = useLocation();

  return useMemo(() => {
    const path = location.pathname;
    if (path === '/dashboard' || path === '/') return PAGE_CONFIG['/dashboard'];
    if (path.includes('/study')) return PAGE_CONFIG['/study'];
    if (path.includes('/leaves/') || path.includes('/notebooks/')) return { ...PAGE_CONFIG['/leaves/'], subtitle: '' };
    if (path.includes('/tags')) return PAGE_CONFIG['/tags'];
    if (path.includes('/bookmarks')) return PAGE_CONFIG['/bookmarks'];
    if (path.includes('/trash')) return PAGE_CONFIG['/trash'];
    if (path.includes('/archived')) return PAGE_CONFIG['/archived'];
    if (path.includes('/todos')) return PAGE_CONFIG['/todos'];
    if (path.includes('/planning')) return PAGE_CONFIG['/planning'];
    if (path.includes('/studies')) return PAGE_CONFIG['/studies'];
    if (path.includes('/shared')) return PAGE_CONFIG['/shared'];
    if (path.includes('/friends')) return PAGE_CONFIG['/friends'];
    return DEFAULT_PAGE;
  }, [location.pathname]);
}
