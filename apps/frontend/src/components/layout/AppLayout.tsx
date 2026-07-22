import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useUIStore } from '../../store/uiStore';
import { Sidebar } from './Sidebar.tsx';
import { AppHeader } from './AppHeader.tsx';
import { ToastContainer } from '../ui/Toast.tsx';
import { PomodoroFloatingTimer } from '../../modules/planning/components/PomodoroFloatingTimer.tsx';
import { usePlanningNotifications } from '../../modules/planning/hooks/usePlanningNotifications.ts';

export const AppLayout: React.FC = () => {
  const { theme } = useUIStore();

  // Aplica o tema correto no elemento HTML ao carregar a página
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Ativa notificações de planejamento (eventos, metas, pomodoro)
  usePlanningNotifications();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 text-slate-900 dark:bg-dark-950 dark:text-dark-50 transition-colors duration-200">
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-grow flex flex-col h-full overflow-hidden">
        <AppHeader />

        {/* Content Outlet */}
        <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden relative p-6 md:p-8">
          <Outlet />
        </main>
      </div>
      <ToastContainer />
      <PomodoroFloatingTimer />
    </div>
  );
};

export default AppLayout;
