import React, { useState } from "react";
import { AlertTriangle, Trash2, LogOut } from "lucide-react";
import { Input } from "../../components/ui/Input.tsx";
import { Button } from "../../components/ui/Button.tsx";
import { api } from "../../core/api/client";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../auth/hooks/useAuth";
import { PasswordChangeForm } from "./PasswordChangeForm.tsx";
import { DeleteAccountModals } from "./DeleteAccountModals.tsx";
import { DangerSection } from "./DangerSection.tsx";

interface ProfileTabContentProps {
  onClose: () => void;
}

export const ProfileTabContent: React.FC<ProfileTabContentProps> = ({ onClose }) => {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();

  const [name, setName] = useState(user?.name || "");
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [showDeleteFlow, setShowDeleteFlow] = useState(false);

  const handleSaveProfile = async () => {
    setSaving(true);
    setSaveMessage(null);
    try {
      await api.put("/auth/profile", { name });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      setSaveMessage("Perfil atualizado com sucesso!");
      setTimeout(() => setSaveMessage(null), 3000);
    } catch {
      setSaveMessage("Erro ao atualizar perfil");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    onClose();
  };

  return (
    <>
      <div className="flex flex-col gap-5 sm:gap-7 max-h-[calc(100dvh-12rem)] overflow-y-auto overscroll-contain pr-1.5 tab-enter">
        {/* User info */}
        <div className="flex items-center gap-4">
          <div
            className="relative w-16 h-16 rounded-full flex items-center justify-center overflow-hidden border-2 flex-shrink-0"
            style={{
              borderColor: 'var(--border-color)',
              background: 'var(--bg-surface-hover)',
            }}
          >
            <img src={user?.avatarUrl || ""} alt="Avatar" className="w-full h-full object-cover" />
            <div className="absolute inset-0 rounded-full ring-2" style={{ boxShadow: '0 0 0 2px var(--bg-surface)' }} />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-heading font-extrabold break-words" style={{ color: 'var(--text-primary)' }}>
              {user?.name || "Meu Perfil"}
            </h2>
            <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-secondary)' }}>{user?.email}</p>
          </div>
        </div>

        {/* Name */}
        <Input
          label="Nome de usuário"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Seu nome"
        />

        {/* Save message */}
        {saveMessage && (
          <div
            className="p-3 rounded-xl text-sm font-medium border"
            style={{
              background: saveMessage.includes("sucesso") ? 'rgba(16,185,129,0.1)' : 'rgba(244,63,94,0.1)',
              borderColor: saveMessage.includes("sucesso") ? 'rgba(16,185,129,0.3)' : 'rgba(244,63,94,0.3)',
              color: saveMessage.includes("sucesso") ? '#34D399' : '#FB7185',
            }}
          >
            {saveMessage}
          </div>
        )}

        <Button onClick={handleSaveProfile} isLoading={saving} className="self-start">
          Salvar Alterações
        </Button>

        {/* Password Change */}
        <PasswordChangeForm />

        {/* Delete Account */}
        <div className="pt-6 pb-2" style={{ borderTop: '1px solid rgba(244,63,94,0.2)' }}>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-rose-500" />
            <span className="text-xs font-bold text-rose-500 uppercase tracking-wider">Zona de Perigo</span>
          </div>
          <DangerSection
            icon={Trash2}
            title="Excluir Conta"
            description="Remover permanentemente sua conta e todos os dados"
            onClick={() => setShowDeleteFlow(true)}
          />
        </div>

        {/* Logout */}
        <div className="pt-6 pb-2" style={{ borderTop: '1px solid var(--border-color)' }}>
          <DangerSection
            icon={LogOut}
            title="Sair da conta"
            description="Fazer logout do aplicativo"
            onClick={handleLogout}
          />
        </div>
      </div>

      {/* Delete Account Flow */}
      {showDeleteFlow && (
        <DeleteAccountModals
          userEmail={user?.email}
          onComplete={() => setShowDeleteFlow(false)}
        />
      )}
    </>
  );
};
