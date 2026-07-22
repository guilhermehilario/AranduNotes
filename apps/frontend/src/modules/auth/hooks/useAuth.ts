import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store';
import authService from '../services/authService';
import type { LoginInput, RegisterInput } from '../types';

export function useAuth() {
  const queryClient = useQueryClient();
  const { login, logout, isAuthenticated, user, accessToken } = useAuthStore();

  const loginMutation = useMutation({
    mutationFn: (credentials: LoginInput) => authService.login(credentials),
    onSuccess: (data) => {
      login(data.user, data.accessToken);
      queryClient.setQueryData(['profile'], data.user);
    },
  });

  const registerMutation = useMutation({
    mutationFn: (data: RegisterInput) => authService.register(data),
    // Registro não faz mais auto-login — usuário precisa verificar e-mail
  });

  const logoutMutation = useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      logout();
      queryClient.clear(); // Limpa todo o cache de queries do React Query
    },
    onError: () => {
      // Mesmo se a chamada de logout falhar no servidor, desloga localmente para segurança
      logout();
      queryClient.clear();
    },
  });

  // Query para sincronizar dados do perfil em tempo real se autenticado
  const profileQuery = useQuery({
    queryKey: ['profile'],
    queryFn: () => authService.getProfile(),
    enabled: isAuthenticated && !!accessToken,
    staleTime: 1000 * 60 * 10, // 10 minutos
  });

  return {
    user: profileQuery.data || user,
    isAuthenticated,
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
    isLoadingProfile: profileQuery.isLoading && isAuthenticated,
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
  };
}
export default useAuth;
