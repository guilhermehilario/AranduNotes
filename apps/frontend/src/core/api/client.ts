import axios from "axios";
import { useAuthStore } from "../../modules/auth/store";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Para cookies seguros contendo Refresh Tokens
});

// ── Helpers ──

/** Decodifica a parte payload de um JWT sem verificar assinatura */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}

/** Verifica se o token está expirado (com margem de 5s para evitar race conditions) */
function isTokenExpired(token: string): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload || !payload.exp) return true;
  // Margem de 5 segundos para evitar requisições no limite da expiração
  return (payload.exp as number) * 1000 < Date.now() - 5000;
}

// ── Controle de Fila para Renovação Concorrente do Token ──

let isRefreshing = false;
let lastRefreshAttempt = 0;
let refreshFailCount = 0;
const MAX_REFRESH_FAILURES = 3;
const REFRESH_COOLDOWN_MS = 60_000; // 1 min de cooldown entre tentativas de refresh
let failedQueue: Array<{
  resolve: (value: string | null) => void;
  reject: (reason: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

/** Redireciona para /login com reload completo — usado fora da árvore React */
function forceRedirectToLogin() {
  if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
    window.location.href = '/login';
  }
}

/** Força logout + redireciona para evitar estado quebrado */
function forceLogoutAndRedirect() {
  useAuthStore.getState().logout();
  forceRedirectToLogin();
}

/**
 * Tenta renovar o access token via refresh token cookie.
 * - Gerencia fila de requisições concorrentes (deduplicação)
 * - Conta falhas para forçar logout após 3 tentativas
 * - Respeita cooldown entre tentativas
 */
async function tryRefreshToken(): Promise<string> {
  // 🔴 Se já estourou o limite de falhas, força logout imediatamente
  if (refreshFailCount >= MAX_REFRESH_FAILURES) {
    forceLogoutAndRedirect();
    throw new Error('Máximo de tentativas de refresh excedido');
  }

  // Se já tentamos refresh recentemente, rejeita (evita loop)
  if (Date.now() - lastRefreshAttempt < REFRESH_COOLDOWN_MS) {
    throw new Error('Refresh em cooldown');
  }

  // Se já está refrescando, enfileira e aguarda
  if (isRefreshing) {
    return new Promise<string | null>((resolve, reject) => {
      failedQueue.push({ resolve, reject });
    }).then((token) => {
      if (!token) throw new Error('Refresh falhou na fila');
      return token;
    });
  }

  isRefreshing = true;

  try {
    const response = await axios.post(
      `${api.defaults.baseURL}/auth/refresh`,
      {},
      { withCredentials: true },
    );

    const { accessToken } = response.data;
    useAuthStore.getState().setAccessToken(accessToken);

    refreshFailCount = 0; // ✅ Reseta contador no refresh bem-sucedido
    processQueue(null, accessToken);

    return accessToken;
  } catch (refreshError) {
    lastRefreshAttempt = Date.now();
    refreshFailCount++;
    processQueue(refreshError, null);

    // 🛑 Se o refresh retornou 401, o token está inválido
    const refreshStatus = (refreshError as { response?: { status?: number } })?.response?.status;

    // Força logout se excedeu limite de falhas ou refresh retornou 401
    if (refreshFailCount >= MAX_REFRESH_FAILURES || refreshStatus === 401) {
      forceLogoutAndRedirect();
    }

    throw refreshError;
  } finally {
    isRefreshing = false;
  }
}

// ── Request Interceptor ──
// Renova o token PROATIVAMENTE se estiver expirado, evitando 401s desnecessários
api.interceptors.request.use(
  async (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token && config.headers) {
      // Se o token está expirado, tenta renovar antes de enviar a requisição
      if (isTokenExpired(token)) {
        try {
          const newToken = await tryRefreshToken();
          config.headers.Authorization = `Bearer ${newToken}`;
          return config;
        } catch {
          // Refresh falhou — usa o token expirado mesmo
          // O response interceptor vai tratar o 401 e redirecionar
          config.headers.Authorization = `Bearer ${token}`;
          return config;
        }
      }
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ── Response Interceptor ──
// Trata 401 como fallback (caso o refresh proativo não tenha sido feito)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      try {
        const newToken = await tryRefreshToken();
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch {
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  },
);
