import React, { useState } from 'react';
import { Lock } from 'lucide-react';
import { Button } from '../../components/ui/Button.tsx';
import { Input } from '../../components/ui/Input.tsx';
import { api } from '../../core/api/client';

export const PasswordChangeForm: React.FC = () => {
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [changingPassword, setChangingPassword] = useState(false);

  const handleChangePassword = async () => {
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword.length < 6) {
      setPasswordError('A nova senha deve ter no mínimo 6 caracteres');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('As senhas não coincidem');
      return;
    }

    setChangingPassword(true);
    try {
      await api.post('/auth/change-password', { currentPassword, newPassword });
      setPasswordSuccess('Senha alterada com sucesso!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setPasswordSuccess(null);
        setShowPasswordForm(false);
      }, 3000);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setPasswordError(error.response?.data?.message || 'Erro ao alterar senha');
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="border-t border-slate-100 dark:border-dark-800/60 pt-6">
      <button
        type="button"
        onClick={() => {
          setShowPasswordForm(!showPasswordForm);
          setPasswordError(null);
          setPasswordSuccess(null);
        }}
        className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-dark-300 hover:text-brand-500 transition-colors cursor-pointer"
      >
        <Lock className="h-4 w-4" />
        {showPasswordForm ? 'Cancelar alteração de senha' : 'Alterar senha'}
      </button>

      {showPasswordForm && (
        <div className="flex flex-col gap-4 mt-4">
          <Input
            label="Senha atual"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Sua senha atual"
          />
          <Input
            label="Nova senha"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Mínimo 6 caracteres"
          />
          <Input
            label="Confirmar nova senha"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repita a nova senha"
          />

          {passwordError && <p className="text-xs text-rose-500 font-medium">{passwordError}</p>}
          {passwordSuccess && <p className="text-xs text-emerald-500 font-medium">{passwordSuccess}</p>}

          <Button
            variant="outline"
            onClick={handleChangePassword}
            isLoading={changingPassword}
            disabled={!currentPassword || !newPassword || !confirmPassword}
            className="self-start"
          >
            Alterar Senha
          </Button>
        </div>
      )}
    </div>
  );
};

export default PasswordChangeForm;
