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

// ── Validação do token contra o backend ──
// Chamada APÓS a hidratação do persist.
//
// Fluxo:
//   1. Tenta renovar o token via /auth/refresh (usa o cookie httpOnly)
//   2. Valida o profile com o token (novo ou existente)
//   3. Se falhar, limpa a sessão
//
// O finally SEMPRE marca isHydrated=true para encerrar o loading.
async function validateTokenAndHydrate(): Promise<void> {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
  if (!import.meta.env.VITE_API_URL && import.meta.env.PROD) {
    console.error('[AuthStore] VITE_API_URL não configurada em produção!');
  }
  const controller = new AbortController();

  // Timeout de 20s para refresh + profile (generoso para cold start)
  const timeoutId = setTimeout(() => controller.abort(), 20_000);

  try {
    const state = useAuthStoreBase.getState();

    // Só valida se houver um token armazenado
    if (!state.accessToken || !state.isAuthenticated) {
      return;
    }

    let token = state.accessToken;

    // ── Passo 1: tenta renovar o token ──
    // O cookie httpOnly com o refresh token é enviado automaticamente
    // com credentials: 'include'. Se o refresh funcionar, usamos o
    // novo access token para validar o profile.
    try {
      const refreshRes = await fetch(`${apiUrl}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
      });

      if (refreshRes.ok) {
        const data = await refreshRes.json();
        if (data.accessToken) {
          token = data.accessToken;
          useAuthStoreBase.getState().setAccessToken(token);
        }
      }
      // Se refresh falhou (401, etc.), mantém o token original e
      // tenta o profile — o profile pode funcionar se o token
      // ainda não expirou (caso normal sem cold start).
    } catch {
      // Erro de rede/timeout no refresh — segue com token original
    }

    // ── Passo 2: valida o token com /auth/profile ──
    try {
      const profileRes = await fetch(`${apiUrl}/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });

      if (profileRes.ok) {
        // ✅ Token válido — mantém a sessão
        console.log('[AuthStore] Token validado com sucesso.');
      } else if (profileRes.status === 401) {
        // 🛑 Token inválido mesmo após tentativa de refresh → limpa sessão
        console.warn('[AuthStore] Token inválido/expirado — limpando sessão.');
        useAuthStoreBase.getState().logout();
      } else {
        // Outro erro HTTP (503 do backend em cold start, etc.)
        // Conservador: limpa sessão
        console.warn(
          `[AuthStore] Resposta inesperada (${profileRes.status}) — limpando sessão.`,
        );
        useAuthStoreBase.getState().logout();
      }
    } catch {
      // Erro de rede ou timeout
      console.warn('[AuthStore] Falha ao validar token (rede/timeout) — limpando sessão.');
      useAuthStoreBase.getState().logout();
    }
  } catch (error) {
    console.error('[AuthStore] Erro inesperado na validação:', error);
  } finally {
    clearTimeout(timeoutId);
    // ✅ GARANTIDO: isHydrated=true sempre executado
    useAuthStoreBase.setState({ isHydrated: true });
  }
}

// ── Inicialização robusta da hidratação ──
// 1. Tenta hasHydrated() síncrono → valida token → marca hidratado
// 2. Se assíncrono, onFinishHydration → valida token → marca hidratado
// 3. Fallback de 8s força hidratação mesmo sem retorno do callback
(function initializeHydration() {
  try {
    if (useAuthStoreBase.persist.hasHydrated()) {
      // Já hidratou (localStorage síncrono) → valida token agora
      validateTokenAndHydrate();
      return;
    }

    // Ainda não hidratou → aguarda o evento de conclusão
    useAuthStoreBase.persist.onFinishHydration(() => {
      validateTokenAndHydrate();
    });
  } catch (error) {
    console.error('[AuthStore] Erro na inicialização da hidratação:', error);
    useAuthStoreBase.setState({ isHydrated: true });
  }

  // 🛡️ Fallback de segurança: após 8s, força o fim do loading.
  // O tempo maior (8s vs 2s original) dá margem para:
  //   - Validação do token contra o backend (pode levar ~3-5s em cold start)
  //   - onFinishHydration que nunca dispara
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
      // Caso extremamente raro — não é possível recuperar
    }
  }, 8000);
})();

export const useAuthStore = useAuthStoreBase;
