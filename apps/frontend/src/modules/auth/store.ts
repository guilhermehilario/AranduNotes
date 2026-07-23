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

// ── Inicialização robusta da hidratação ──
// O bloco try/catch + setTimeout garante que o loading SEMPRE
// seja encerrado, mesmo em cenários de falha (token inválido,
// erro de rede, API fora do ar, etc.).
(function initializeHydration() {
  try {
    if (useAuthStoreBase.persist.hasHydrated()) {
      useAuthStoreBase.setState({ isHydrated: true });
      return;
    }

    // Se ainda não hidratou, escuta o evento de conclusão
    useAuthStoreBase.persist.onFinishHydration(() => {
      try {
        useAuthStoreBase.setState({ isHydrated: true });
      } catch (error) {
        console.error('[AuthStore] Erro ao finalizar hidratação:', error);
      }
    });
  } catch {
    // Se a API do persist não estiver disponível ou falhar,
    // marca como hidratado mesmo assim para não travar o app.
    useAuthStoreBase.setState({ isHydrated: true });
  } finally {
    // 🛡️ Fallback de segurança: após 2 segundos, força o fim do loading.
    // Isso protege contra:
    //   - onFinishHydration que nunca dispara
    //   - hasHydrated() que nunca retorna true
    //   - Erros silenciosos na API do persist
    setTimeout(() => {
      try {
        if (!useAuthStoreBase.getState().isHydrated) {
          console.warn(
            '[AuthStore] Hydration timeout — forçando isHydrated=true '
            + 'para evitar loading infinito.',
          );
          useAuthStoreBase.setState({ isHydrated: true });
        }
      } catch {
        // Não é possível recuperar — o usuário verá loading infinito
        // (caso extremamente raro)
      }
    }, 2000);
  }
})();

export const useAuthStore = useAuthStoreBase;
