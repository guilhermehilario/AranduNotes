import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../modules/auth/store';

interface PrivateRouteProps {
  children: React.ReactNode;
}

export const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const location = useLocation();

  if (!isAuthenticated) {
    // Redireciona para login salvando a página que tentou acessar para redirecionamento posterior
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
export default PrivateRoute;
