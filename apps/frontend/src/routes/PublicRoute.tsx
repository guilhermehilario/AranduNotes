import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../modules/auth/store';
import { LoadingScreen } from '../components/ui/LoadingScreen.tsx';

interface PublicRouteProps {
  children: React.ReactNode;
}

export const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const location = useLocation();

  // 🟡 Aguarda a hidratação do store antes de decidir o redirecionamento.
  //    Isso evita que um usuário logado seja mostrado na tela de login
  //    por um instante enquanto o Zustand carrega o estado persistido.
  if (!isHydrated) {
    return <LoadingScreen />;
  }

  if (isAuthenticated) {
    // Redireciona para o destino salvo (from) ou para o dashboard caso não exista
    const state = location.state as { from?: { pathname?: string } } | null;
    const origin = state?.from?.pathname || '/dashboard';
    return <Navigate to={origin} replace />;
  }

  return <>{children}</>;
};
export default PublicRoute;
