import React from 'react';
import { useUIStore } from '../../store/uiStore';
import { useAuth } from '../../modules/auth/hooks/useAuth';
import { useBreadcrumbs } from './app-header/hooks/useBreadcrumbs';
import { usePageConfig } from './app-header/hooks/usePageConfig';
import { HeaderTitle } from './app-header/components/HeaderTitle';
import { HeaderActions } from './app-header/components/HeaderActions';

export const AppHeader: React.FC = () => {
  const { toggleMobileSidebar } = useUIStore();
  const { user } = useAuth();
  const breadcrumbs = useBreadcrumbs();
  const pageConfig = usePageConfig();

  return (
    <header className="h-14 sm:h-16 bg-white dark:bg-dark-900 border-b border-slate-150 dark:border-dark-800/80 flex items-center justify-between px-3 sm:px-6 flex-shrink-0">
      <HeaderTitle
        breadcrumbs={breadcrumbs}
        pageConfig={pageConfig}
        onMenuClick={toggleMobileSidebar}
      />

      <HeaderActions user={user} />
    </header>
  );
};

export default AppHeader;
