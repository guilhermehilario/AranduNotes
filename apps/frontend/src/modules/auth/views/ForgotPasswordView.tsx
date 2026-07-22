import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import { authService } from '../services/authService';
import { Input } from '../../../components/ui/Input.tsx';
import { Button } from '../../../components/ui/Button.tsx';
import { ApiErrorAlert } from '../../../components/ui/ApiErrorAlert.tsx';
import { extractApiError } from '../../../utils/api-errors.ts';
import { AuthLayout } from '../AuthLayout.tsx';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';

const ForgotPasswordSchema = z.object({
  email: z.string().email('E-mail inválido'),
});

type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;

export const ForgotPasswordView: React.FC = () => {
  const [step, setStep] = React.useState<'form' | 'sent'>('form');
  const [apiError, setApiError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(ForgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (data: ForgotPasswordInput) => {
    setApiError(null);
    setIsLoading(true);
    try {
      await authService.forgotPassword(data.email);
      setStep('sent');
    } catch (error) {
      setApiError(extractApiError(error, 'Erro ao enviar e-mail. Tente novamente.'));
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 'sent') {
    return (
      <AuthLayout
        title="E-mail Enviado"
      footer={
          <Link
            to="/login"
            className="text-sm text-slate-500 dark:text-dark-400 hover:text-slate-700 dark:hover:text-dark-200"
          >
            Voltar para o login
          </Link>
        }
      >
        <div className="flex flex-col items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
            <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <div className="text-center space-y-1">
            <h3 className="text-lg font-bold text-slate-900 dark:text-dark-50">
              Verifique seu E-mail
            </h3>
            <p className="text-slate-600 dark:text-dark-300 text-sm">
              Enviamos um link de recuperação para seu e-mail.
            </p>
            <p className="text-slate-500 dark:text-dark-400 text-xs">
              Clique no link recebido para criar uma nova senha. Não esqueça de
              verificar a caixa de spam.
            </p>
          </div>
          <Link
            to="/login"
            className="text-sm text-brand-500 hover:text-brand-600 font-medium inline-flex items-center gap-1.5"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Voltar para o login
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Recuperar Senha"

      footer={
        <>
          Lembrou sua senha?{' '}
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

      <p className="text-sm text-slate-600 dark:text-dark-300 mb-4">
        Digite seu e-mail cadastrado e enviaremos um link para redefinir sua senha.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input
          label="E-mail"
          type="email"
          placeholder="exemplo@email.com"
          error={errors.email?.message}
          {...register('email')}
        />

        <Button type="submit" className="w-full mt-2" isLoading={isLoading}>
          <Mail className="h-4 w-4 mr-2" />
          Enviar Link de Recuperação
        </Button>
      </form>
    </AuthLayout>
  );
};

export default ForgotPasswordView;
