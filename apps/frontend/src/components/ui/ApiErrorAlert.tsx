import React from 'react';

interface ApiErrorAlertProps {
  message: string | null;
}

/**
 * ApiErrorAlert — Alerta de erro estilizado para formulários de autenticação.
 * Elimina duplicação do bloco de erro entre LoginView e RegisterView.
 */
export const ApiErrorAlert: React.FC<ApiErrorAlertProps> = ({ message }) => {
  if (!message) return null;

  return (
    <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-sm font-medium dark:bg-rose-950/20 dark:border-rose-950/30 dark:text-rose-400">
      {message}
    </div>
  );
};

export default ApiErrorAlert;
