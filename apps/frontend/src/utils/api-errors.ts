/**
 * Extrai a mensagem de erro de uma exceção de API.
 * Suporta:
 * - Erros com response.data.message (NestJS HTTP exceptions)
 * - Erros de rede (timeout, conexão)
 * - Erros genéricos
 */
export function extractApiError(
  error: unknown,
  fallbackMessage = 'Erro inesperado. Tente novamente.',
): string {
  const apiError = error as {
    response?: { data?: { message?: string } };
    message?: string;
    code?: string;
  };

  // Erro estruturado do backend NestJS
  if (apiError.response?.data?.message) {
    return apiError.response.data.message;
  }

  // Erro de rede (timeout, conexão, etc.)
  if (apiError.code === 'ECONNABORTED') {
    return 'A requisição excedeu o tempo limite. Verifique sua conexão e tente novamente.';
  }

  if (apiError.code === 'ERR_NETWORK' || apiError.message?.includes('Network Error')) {
    return 'Não foi possível conectar ao servidor. Verifique sua conexão de internet.';
  }

  if (apiError.message?.toLowerCase().includes('timeout')) {
    return 'O servidor não respondeu a tempo. Tente novamente mais tarde.';
  }

  // Mensagem direta do erro (útil para erros síncronos)
  if (apiError.message) {
    return apiError.message;
  }

  return fallbackMessage;
}
