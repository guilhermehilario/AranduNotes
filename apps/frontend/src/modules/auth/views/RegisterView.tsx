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

export const RegisterView: React.FC = () => {
  const { register: registerUser, isRegistering } = useAuth();
  const navigate = useNavigate();
  const [apiError, setApiError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  });

  const onSubmit = async (data: RegisterInput) => {
    setApiError(null);
    try {
      const result = await registerUser(data);
      // Se o email já foi verificado (ex: modo dev sem SMTP), vai direto pro login
      if (result.message?.toLowerCase().includes('auto-verificado') ||
          result.message?.toLowerCase().includes('já pode fazer login')) {
        navigate(`/login?email=${encodeURIComponent(data.email)}&verified=true`);
      } else {
        // Precisa verificar o email — redireciona pra tela de verificação
        navigate(`/verify-email?email=${encodeURIComponent(data.email)}`);
      }
    } catch (error) {
      setApiError(extractApiError(error, 'Erro ao criar conta. Tente novamente mais tarde.'));
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

        <Button type="submit" className="w-full mt-2" isLoading={isRegistering}>
          Criar Conta
        </Button>
      </form>
    </AuthLayout>
  );
};

export default RegisterView;
