/**
 * Extrai a mensagem de erro de uma exceção de API.
 * Suporta:
 * - Erros com response.data.message (NestJS HTTP exceptions)
 * - Erros de rede (timeout, conexão)
 * - Erros de cold start do servidor
 * - Erros genéricos
 */
export function extractApiError(
  error: unknown,
  fallbackMessage = 'Erro inesperado. Tente novamente.',
): string {
  const apiError = error as {
    response?: { data?: { message?: string; statusCode?: number; error?: string } };
    message?: string;
    code?: string;
    status?: number;
  };

  // Erro estruturado do backend NestJS
  if (apiError.response?.data?.message) {
    const msg = apiError.response.data.message;

    // Detecta erros específicos de banco/cold start
    if (
      msg.toLowerCase().includes('indisponível') ||
      msg.toLowerCase().includes('inicializando') ||
      msg.toLowerCase().includes('temporariamente')
    ) {
      return `${msg} (O servidor pode estar acordando de um período de inatividade.)`;
    }

    return msg;
  }

  // Erro de timeout / servidor demorando (cold start no Render)
  if (apiError.code === 'ECONNABORTED' || apiError.message?.includes('timeout of')) {
    return (
      'O servidor demorou muito para responder. Isso pode ocorrer quando o servidor ' +
      'está inicializando após um período de inatividade. Tente novamente em alguns instantes.'
    );
  }

  // Erro de rede / servidor offline
  if (apiError.code === 'ERR_NETWORK' || apiError.message?.includes('Network Error')) {
    return (
      'Não foi possível conectar ao servidor. O servidor pode estar inicializando ' +
      '(após período de inatividade) ou sua conexão de internet pode estar instável. ' +
      'Tente novamente em alguns segundos.'
    );
  }

  // Erro 503 (Service Unavailable) - banco offline
  if (apiError.response?.data?.statusCode === 503) {
    return (
      'O banco de dados está temporariamente indisponível. ' +
      'O servidor pode estar acordando de um período de inatividade. Tente novamente.'
    );
  }

  // Qualquer timeout
  if (apiError.message?.toLowerCase().includes('timeout')) {
    return 'O servidor não respondeu a tempo. Tente novamente mais tarde.';
  }

  // Mensagem direta do erro (útil para erros síncronos)
  if (apiError.message) {
    return apiError.message;
  }

  return fallbackMessage;
}
