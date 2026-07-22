/**
 * Extrai a mensagem de erro de uma exceção de API.
 * Função pura que centraliza o pattern `error.response?.data?.message`.
 */
export function extractApiError(
  error: unknown,
  fallbackMessage = 'Erro inesperado. Tente novamente.',
): string {
  const apiError = error as {
    response?: { data?: { message?: string } };
  };
  return apiError.response?.data?.message || fallbackMessage;
}
