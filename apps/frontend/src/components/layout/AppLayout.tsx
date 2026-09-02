import React, { useEffect, useRef } from 'react';
import { Outlet } from 'react-router-dom';
import { useUIStore, type ThemePreference } from '../../store/uiStore';
import { useAuth } from '../../modules/auth/hooks/useAuth';
import { Sidebar } from './Sidebar.tsx';
import { AppHeader } from './AppHeader.tsx';
import { ToastContainer } from '../ui/Toast.tsx';
import { PomodoroFloatingTimer } from '../../modules/planning/components/PomodoroFloatingTimer.tsx';
import { WelcomeModal } from '../../modules/auth/components/WelcomeModal.tsx';
import { usePlanningNotifications } from '../../modules/planning/hooks/usePlanningNotifications.ts';
import { useClipboardCapture } from '../../modules/clipboard/hooks/useClipboardCapture.ts';
import { usePresenceHeartbeat } from '../../modules/friends/hooks/useFriends';
import { useFriendNotifications } from '../../modules/friends/hooks/useFriendNotifications';

/** Hook que retorna a preferência de tema efetiva do sistema (matchMedia). */
function useSystemTheme(): 'light' | 'dark' {
  const [systemTheme, setSystemTheme] = React.useState<'light' | 'dark'>(() =>
    window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  );

  useEffect(() => {
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e: MediaQueryListEvent) =>
      setSystemTheme(e.matches ? 'dark' : 'light');
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return systemTheme;
}

export const AppLayout: React.FC = () => {
  const theme = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);
  const { user } = useAuth();
  const systemTheme = useSystemTheme();
  // Guarda o último tema vindo do servidor e se o usuário já fez uma troca
  // local (para não sobrescrever a escolha do usuário com dados antigos).
  const lastSyncedThemeRef = useRef<ThemePreference | null>(null);
  const userChangedThemeRef = useRef(false);

  // 1) Detecção de troca local: se o usuário mudar o tema e ele divergir do
  //    tema do servidor, marca a preferência local como mais recente.
  // 2) Sincronização do servidor (fonte da verdade entre dispositivos): no
  //    primeiro carregamento aplica o tema salvo; depois disso, só reaplica
  //    se o usuário não tiver trocado o tema manualmente nesta sessão.
  useEffect(() => {
    const serverTheme = user?.theme as ThemePreference | undefined;

    if (serverTheme && serverTheme !== theme) {
      userChangedThemeRef.current = true;
    }

    if (!serverTheme) return;

    const firstSync = lastSyncedThemeRef.current === null;
    const serverChanged = lastSyncedThemeRef.current !== serverTheme;

    if (firstSync || (serverChanged && !userChangedThemeRef.current)) {
      lastSyncedThemeRef.current = serverTheme;
      if (serverTheme !== theme) {
        setTheme(serverTheme);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme, user?.theme]);

  // Aplica o tema correto no elemento HTML sempre que a preferência mudar.
  // Em modo 'system', também reage à troca de tema do sistema operacional.
  useEffect(() => {
    const effective =
      theme === 'system' ? systemTheme : (theme as 'light' | 'dark');
    if (effective === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme, systemTheme]);

  // Ativa notificações de planejamento (eventos, metas, pomodoro)
  usePlanningNotifications();

  // Ativa captura global de eventos de cópia
  useClipboardCapture();

  // Presença: envia heartbeat enquanto o app está aberto
  usePresenceHeartbeat();

  // Notificações de amizade (novos pedidos / amigos aceitos)
  useFriendNotifications();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 text-slate-900 dark:bg-dark-950 dark:text-dark-50 transition-colors duration-200">
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-grow flex flex-col h-full overflow-hidden min-w-0">
        <AppHeader />

        {/* Content Outlet - reduced padding on mobile */}
        <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden relative p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
      <ToastContainer />
      <PomodoroFloatingTimer />
      <WelcomeModal />
    </div>
  );
};

export default AppLayout;
