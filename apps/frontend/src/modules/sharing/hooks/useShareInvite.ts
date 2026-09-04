import { useState } from 'react';
import { EMAIL_REGEX } from '../constants';
import { useToastStore } from '../../../store/toastStore';
import { extractApiError } from '../../../utils/api-errors';

interface UseShareInviteParams {
  createShare: (data: { email: string }) => Promise<unknown>;
}

export function useShareInvite({ createShare }: UseShareInviteParams) {
  const addToast = useToastStore((s) => s.addToast);
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string>();

  const handleAdd = async () => {
    const value = email.trim();
    if (!EMAIL_REGEX.test(value)) {
      setEmailError('Digite um e-mail válido.');
      return;
    }
    setEmailError(undefined);
    try {
      await createShare({ email: value });
      setEmail('');
      addToast('Acesso compartilhado.', 'success');
    } catch (error) {
      addToast(
        extractApiError(error, 'Não foi possível compartilhar.'),
        'error',
      );
    }
  };

  return { email, setEmail, emailError, handleAdd };
}