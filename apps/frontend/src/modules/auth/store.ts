import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from './types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  /** Flag que indica se o estado já foi hidratado do localStorage.
   *  Durante o carregamento inicial (F5/refresh), os guards de rota
   *  devem aguardar isHydrated=true antes de decidir o redirecionamento,
   *  evitando o flicker para /login. */
  isHydrated: boolean;
  login: (user: User, accessToken: string) => void;
  logout: () => void;
  setAccessToken: (token: string) => void;
  updateUser: (user: User) => void;
}

// ⚠️ Cria a store primeiro (SEM onRehydrateStorage para evitar
//    referência circular / temporal dead zone).
const useAuthStoreBase = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isHydrated: false,
      login: (user, accessToken) =>
        set({ user, accessToken, isAuthenticated: true }),
      logout: () =>
        set({ user: null, accessToken: null, isAuthenticated: false }),
      setAccessToken: (accessToken) =>
        set({ accessToken, isAuthenticated: !!accessToken }),
      updateUser: (user) =>
        set({ user }),
    }),
    {
      name: 'studynotes-auth', // Nome da chave no localStorage
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);

// ── Subscrição de hidratação (APÓS a store existir) ──
// Isso evita a referência circular onde onRehydrateStorage tentava
// usar useAuthStore dentro do próprio create().
// Para localStorage, a hidratação é síncrona — pode já ter ocorrido.

if (useAuthStoreBase.persist.hasHydrated()) {
  useAuthStoreBase.setState({ isHydrated: true });
} else {
  // Se ainda não hidratou, escuta o evento de conclusão
  useAuthStoreBase.persist.onFinishHydration(() => {
    useAuthStoreBase.setState({ isHydrated: true });
  });
}

export const useAuthStore = useAuthStoreBase;
