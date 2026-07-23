import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../modules/auth/store';
import { LoadingScreen } from '../components/ui/LoadingScreen.tsx';

interface PrivateRouteProps {
  children: React.ReactNode;
}

export const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const location = useLocation();

  // 🟡 Aguarda a hidratação do store antes de decidir o redirecionamento.
  //    Isso evita o flicker para /login quando a página é recarregada (F5)
  //    e o Zustand ainda está lendo os dados do localStorage.
  if (!isHydrated) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    // Redireciona para login salvando a página que tentou acessar para redirecionamento posterior
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
export default PrivateRoute;
