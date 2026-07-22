import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { authService } from '../services/authService';
import { Input } from '../../../components/ui/Input.tsx';
import { Button } from '../../../components/ui/Button.tsx';
import { ApiErrorAlert } from '../../../components/ui/ApiErrorAlert.tsx';
import { extractApiError } from '../../../utils/api-errors.ts';
import { AuthLayout } from '../AuthLayout.tsx';
import { Lock, CheckCircle, AlertTriangle, ArrowLeft } from 'lucide-react';

const ResetPasswordSchema = z
  .object({
    password: z.string().min(8, 'A senha deve ter no mínimo 8 caracteres'),
    confirmPassword: z.string().min(8, 'A confirmação de senha deve ter no mínimo 8 caracteres'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  });

type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;

type ResetStep = 'invalid' | 'expired' | 'form' | 'success' | 'error';

export const ResetPasswordView: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [step, setStep] = React.useState<ResetStep>(token ? 'form' : 'invalid');
  const [apiError, setApiError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(ResetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const onSubmit = async (data: ResetPasswordInput) => {
    if (!token) return;
    setApiError(null);
    setIsLoading(true);
    try {
      await authService.resetPassword(token, data.password);
      setStep('success');
    } catch (error) {
      const errorMsg = extractApiError(error, '');
      if (errorMsg.toLowerCase().includes('expirado')) {
        setStep('expired');
      } else {
        setStep('error');
        setApiError(errorMsg || 'Erro ao redefinir senha. Tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const renderContent = () => {
    switch (step) {
      case 'invalid':
        return (
          <div className="flex flex-col items-center gap-5">
            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-slate-900 dark:text-dark-50">
                Link Inválido
              </h3>
              <p className="text-slate-600 dark:text-dark-300 text-sm">
                Nenhum token de recuperação foi encontrado na URL.
              </p>
            </div>
            <Link
              to="/forgot-password"
              className="text-sm text-brand-500 hover:text-brand-600 font-medium inline-flex items-center gap-1.5"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Solicitar novo link
            </Link>
          </div>
        );

      case 'expired':
        return (
          <div className="flex flex-col items-center gap-5">
            <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-8 w-8 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-slate-900 dark:text-dark-50">
                Link Expirado
              </h3>
              <p className="text-slate-600 dark:text-dark-300 text-sm">
                Este link de recuperação expirou. Solicite um novo.
              </p>
            </div>
            <Link
              to="/forgot-password"
              className="text-sm text-brand-500 hover:text-brand-600 font-medium inline-flex items-center gap-1.5"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Solicitar novo link
            </Link>
          </div>
        );

      case 'success':
        return (
          <div className="flex flex-col items-center gap-5">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-slate-900 dark:text-dark-50">
                Senha Redefinida!
              </h3>
              <p className="text-slate-600 dark:text-dark-300 text-sm">
                Sua senha foi alterada com sucesso.
              </p>
            </div>
            <Button onClick={() => navigate('/login')}>
              Fazer Login
            </Button>
          </div>
        );

      case 'form':
      default:
        return (
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <p className="text-sm text-slate-600 dark:text-dark-300">
              Escolha uma nova senha para sua conta.
            </p>

            <Input
              label="Nova Senha"
              type="password"
              placeholder="Mínimo de 6 caracteres"
              error={errors.password?.message}
              {...register('password')}
            />

            <Input
              label="Confirmar Nova Senha"
              type="password"
              placeholder="Repita a nova senha"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />

            <Button type="submit" className="w-full" isLoading={isLoading}>
              <Lock className="h-4 w-4 mr-2" />
              Redefinir Senha
            </Button>
          </form>
        );
    }
  };

  return (
    <AuthLayout
      title={step === 'success' ? 'Senha Redefinida' : 'Redefinir Senha'}

      footer={
        <Link
          to="/login"
          className="text-sm text-slate-500 dark:text-dark-400 hover:text-slate-700 dark:hover:text-dark-200"
        >
          Voltar para o login
        </Link>
      }
    >
      <ApiErrorAlert message={apiError} />
      {renderContent()}
    </AuthLayout>
  );
};

export default ResetPasswordView;
