import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { RegisterSchema } from '../types';
import type { RegisterInput } from '../types';
import { Input } from '../../../components/ui/Input.tsx';
import { Button } from '../../../components/ui/Button.tsx';
import { ApiErrorAlert } from '../../../components/ui/ApiErrorAlert.tsx';
import { extractApiError } from '../../../utils/api-errors.ts';
import { AuthLayout } from '../AuthLayout.tsx';
import { TermsOfUse } from '../components/TermsOfUse.tsx';
import { useToastStore } from '../../../store/toastStore.ts';

export const RegisterView: React.FC = () => {
  const { register: registerUser, isRegistering } = useAuth();
  const navigate = useNavigate();
  const [apiError, setApiError] = React.useState<string | null>(null);
  const [termsModalOpen, setTermsModalOpen] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<RegisterInput>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      acceptedTerms: false,
    },
  });

  const acceptedTerms = watch('acceptedTerms');

  const onSubmit = async (data: RegisterInput) => {
    setApiError(null);
    try {
      const result = await registerUser(data);
      const addToast = useToastStore.getState().addToast;

      // Detecta se o email não pôde ser enviado (timeout SMTP)
      const hasEmailTimeout =
        result.message?.toLowerCase().includes('não foi possível') ||
        result.message?.toLowerCase().includes('não respondeu') ||
        result.message?.toLowerCase().includes('timeout');

      if (hasEmailTimeout) {
        addToast(
          'Conta criada, mas o e-mail de verificação não pôde ser enviado ' +
          'por um timeout no servidor. Você pode reenviar na tela de verificação.',
          'info',
        );
      }

      // Se o email já foi verificado (ex: modo dev sem SMTP), vai direto pro login
      if (
        result.message?.toLowerCase().includes('auto-verificado') ||
        result.message?.toLowerCase().includes('já pode fazer login')
      ) {
        addToast('Conta criada com sucesso! Faça login para continuar.', 'success');
        navigate(
          `/login?email=${encodeURIComponent(data.email)}&verified=true`,
        );
      } else {
        // Precisa verificar o email — redireciona pra tela de verificação
        if (!hasEmailTimeout) {
          addToast('Conta criada! Verifique seu e-mail para ativar.', 'success');
        }
        navigate(`/verify-email?email=${encodeURIComponent(data.email)}`);
      }
    } catch (error) {
      const errorMsg = extractApiError(
        error,
        'Erro ao criar conta. Tente novamente mais tarde.',
      );

      // Se for um erro de timeout do SMTP, mostra mensagem mais amigável
      if (
        errorMsg.toLowerCase().includes('timeout') ||
        errorMsg.toLowerCase().includes('não respondeu')
      ) {
        setApiError(
          'O servidor de e-mail está demorando para responder. ' +
          'Sua conta foi criada, mas pode ser necessário reenviar a verificação depois.',
        );
      } else {
        setApiError(errorMsg);
      }
    }
  };

  return (
    <AuthLayout
      title="Crie sua conta"
      footer={
        <>
          Já possui uma conta?{' '}
          <Link
            to="/login"
            className="font-bold text-brand-500 hover:text-brand-600 transition-colors"
          >
            Fazer login
          </Link>
        </>
      }
    >
      <ApiErrorAlert message={apiError} />

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input
          label="Nome Completo"
          type="text"
          placeholder="Como quer ser chamado?"
          error={errors.name?.message}
          {...register('name')}
        />

        <Input
          label="E-mail"
          type="email"
          placeholder="exemplo@email.com"
          error={errors.email?.message}
          {...register('email')}
        />

        <Input
          label="Senha"
          type="password"
          placeholder="Mínimo de 6 caracteres"
          error={errors.password?.message}
          {...register('password')}
        />

        <Input
          label="Confirmação de Senha"
          type="password"
          placeholder="Repita sua senha"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        {/* ── Terms of Use Checkbox ── */}
        <div className="flex items-start gap-3 mt-1">
          <input
            type="checkbox"
            id="acceptedTerms"
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 dark:border-dark-600 text-brand-500 focus:ring-brand-500/50 cursor-pointer"
            checked={!!acceptedTerms}
            onChange={(e) =>
              setValue('acceptedTerms', e.target.checked ? true : (false as unknown as true), {
                shouldValidate: true,
              })
            }
          />
          <label
            htmlFor="acceptedTerms"
            className="text-sm text-slate-600 dark:text-dark-300 leading-relaxed cursor-pointer select-none"
          >
            Li e aceito os{' '}
            <button
              type="button"
              onClick={() => setTermsModalOpen(true)}
              className="font-semibold text-brand-500 hover:text-brand-600 underline underline-offset-2 transition-colors"
            >
              Termos de Uso e Responsabilidade
            </button>
            .
          </label>
        </div>
        {errors.acceptedTerms && (
          <p className="text-xs text-red-500 dark:text-red-400 -mt-2">
            {errors.acceptedTerms.message}
          </p>
        )}

        <Button
          type="submit"
          className="w-full mt-2"
          isLoading={isRegistering}
          disabled={!acceptedTerms}
        >
          Criar Conta
        </Button>
      </form>

      {/* Terms of Use Modal */}
      <TermsOfUse
        isOpen={termsModalOpen}
        onClose={() => setTermsModalOpen(false)}
      />
    </AuthLayout>
  );
};

export default RegisterView;
