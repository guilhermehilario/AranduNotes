import React, { useState, useCallback, useEffect } from "react";
import { User, Camera, Settings, LogOut, ChevronRight, AlertTriangle, Trash2 } from "lucide-react";
import { Modal } from "../../components/ui/Modal.tsx";
import { Button } from "../../components/ui/Button.tsx";
import { Input } from "../../components/ui/Input.tsx";
import { useAuth } from "../auth/hooks/useAuth";
import { api } from "../../core/api/client";
import { useQueryClient } from "@tanstack/react-query";
import { AVATAR_CATEGORIES, getAvatarUrl } from "./avatarCategories";
import { AvatarSelector } from "./AvatarSelector";
import { SettingsTab } from "./SettingsTab";
import { PasswordChangeForm } from "./PasswordChangeForm";
import { DeleteAccountModals } from "./DeleteAccountModals";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Tab = "profile" | "avatars" | "settings";

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [showDeleteFlow, setShowDeleteFlow] = useState(false);

  // Reseta o fluxo de exclusão ao fechar o modal
  useEffect(() => {
    if (!isOpen) setShowDeleteFlow(false);
  }, [isOpen]);

  // Sincroniza o campo de nome com o usuário do hook
  useEffect(() => {
    setName(user?.name || "");
  }, [user?.name]);

  // Sincroniza avatar com o usuário quando abre o modal
  useEffect(() => {
    if (user?.avatarUrl) {
      for (const cat of AVATAR_CATEGORIES) {
        if (user.avatarUrl.includes(`/${cat.style}/`)) {
          setSelectedCategory(cat.id);
          break;
        }
      }
      const match = user.avatarUrl.match(/seed=([^&]+)/);
      if (match) {
        const decodedSeed = decodeURIComponent(match[1]);
        for (const cat of AVATAR_CATEGORIES) {
          const found = cat.variants.find((v) => v.seed === decodedSeed);
          if (found) {
            setSelectedVariant(found.id);
            break;
          }
        }
      }
    }
  }, [user?.avatarUrl, isOpen]);

  // Profile state
  const [name, setName] = useState(user?.name || "");
  const [selectedCategory, setSelectedCategory] = useState<string>(() => {
    if (user?.avatarUrl) {
      for (const cat of AVATAR_CATEGORIES) {
        if (user.avatarUrl.includes(`/${cat.style}/`)) return cat.id;
      }
    }
    return "adventurer";
  });
  const [selectedVariant, setSelectedVariant] = useState<string>(() => {
    if (user?.avatarUrl) {
      const match = user.avatarUrl.match(/seed=([^&]+)/);
      if (match) {
        const decodedSeed = decodeURIComponent(match[1]);
        for (const cat of AVATAR_CATEGORIES) {
          const found = cat.variants.find((v) => v.seed === decodedSeed);
          if (found) return found.id;
        }
      }
    }
    return "adv-luna";
  });
  const [customAvatarUrl, setCustomAvatarUrl] = useState<string | null>(null);

  // Profile save state
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaveMessage, setProfileSaveMessage] = useState<string | null>(null);

  // Avatar save state
  const [savingAvatar, setSavingAvatar] = useState(false);
  const [avatarSaveMessage, setAvatarSaveMessage] = useState<string | null>(null);

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    setProfileSaveMessage(null);
    try {
      await api.put("/auth/profile", { name });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      setProfileSaveMessage("Perfil atualizado com sucesso!");
      setTimeout(() => setProfileSaveMessage(null), 3000);
    } catch {
      setProfileSaveMessage("Erro ao atualizar perfil");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveAvatar = async () => {
    setSavingAvatar(true);
    setAvatarSaveMessage(null);
    try {
      let avatarUrl: string;
      if (customAvatarUrl) {
        avatarUrl = customAvatarUrl;
      } else {
        const currentCategory =
          AVATAR_CATEGORIES.find((c) => c.id === selectedCategory) ||
          AVATAR_CATEGORIES[0];
        const currentVariant =
          currentCategory.variants.find((v) => v.id === selectedVariant) ||
          currentCategory.variants[0];
        avatarUrl = getAvatarUrl(
          currentCategory.style,
          currentVariant.seed,
        );
      }
      await api.put("/auth/profile", { avatarUrl });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      setAvatarSaveMessage("Avatar atualizado com sucesso!");
      setTimeout(() => setAvatarSaveMessage(null), 3000);
    } catch {
      setAvatarSaveMessage("Erro ao atualizar avatar");
    } finally {
      setSavingAvatar(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    onClose();
  };

  const handleDeleteComplete = useCallback(() => {
    setShowDeleteFlow(false);
  }, []);

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title=""
        size="lg"
      >
        {/* Animações das abas */}
        <style>{`
          @keyframes tab-fade-slide {
            from {
              opacity: 0;
              transform: translateY(12px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .tab-enter {
            animation: tab-fade-slide 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          }
        `}</style>

        {/* Tabs */}
        <div
          className="flex -mx-6 px-6 mb-6 sticky top-0 z-10 rounded-t-2xl"
          style={{
            background: 'var(--bg-surface)',
            borderBottom: '1px solid var(--border-color)',
          }}
        >
          <button
            onClick={() => setActiveTab("profile")}
            className={`relative flex items-center gap-2 pb-4 px-4 font-heading font-bold text-sm tracking-wide transition-all duration-300 cursor-pointer ${
              activeTab === "profile"
                ? "text-brand-500"
                : "hover:opacity-80 text-[var(--text-secondary)]"
            }`}
          >
            <User className="h-4 w-4" /> Perfil
            <span
              className={`absolute bottom-0 left-0 right-0 h-0.5 rounded-full transition-all duration-300 ${
                activeTab === "profile"
                  ? "bg-brand-500 scale-x-100"
                  : "bg-transparent scale-x-0"
              }`}
            />
          </button>
          <button
            onClick={() => setActiveTab("avatars")}
            className={`relative flex items-center gap-2 pb-4 px-4 font-heading font-bold text-sm tracking-wide transition-all duration-300 cursor-pointer ${
              activeTab === "avatars"
                ? "text-brand-500"
                : "hover:opacity-80 text-[var(--text-secondary)]"
            }`}
          >
            <Camera className="h-4 w-4" /> Avatares
            <span
              className={`absolute bottom-0 left-0 right-0 h-0.5 rounded-full transition-all duration-300 ${
                activeTab === "avatars"
                  ? "bg-brand-500 scale-x-100"
                  : "bg-transparent scale-x-0"
              }`}
            />
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`relative flex items-center gap-2 pb-4 px-4 font-heading font-bold text-sm tracking-wide transition-all duration-300 cursor-pointer ${
              activeTab === "settings"
                ? "text-brand-500"
                : "hover:opacity-80 text-[var(--text-secondary)]"
            }`}
          >
            <Settings className="h-4 w-4" /> Configurações
            <span
              className={`absolute bottom-0 left-0 right-0 h-0.5 rounded-full transition-all duration-300 ${
                activeTab === "settings"
                  ? "bg-brand-500 scale-x-100"
                  : "bg-transparent scale-x-0"
              }`}
            />
          </button>
        </div>

        {/* ── CONTEÚDO: PERFIL ── */}
        {activeTab === "profile" && (
          <div className="flex flex-col gap-7 max-h-[calc(90vh-12rem)] overflow-y-auto pr-1 tab-enter">
            {/* User info */}
            <div className="flex items-center gap-4">
              <div
                className="relative w-16 h-16 rounded-full flex items-center justify-center overflow-hidden border-2 flex-shrink-0"
                style={{
                  borderColor: 'var(--border-color)',
                  background: 'var(--bg-surface-hover)',
                }}
              >
                <img
                  src={user?.avatarUrl || ""}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
                <div
                  className="absolute inset-0 rounded-full ring-2"
                  style={{ outline: '2px solid var(--bg-surface)' }}
                />
              </div>
              <div>
                <h2 className="text-lg font-heading font-extrabold" style={{ color: 'var(--text-primary)' }}>
                  {user?.name || "Meu Perfil"}
                </h2>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                  {user?.email}
                </p>
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
            {profileSaveMessage && (
              <div
                className={`p-3 rounded-xl text-sm font-medium border`}
                style={{
                  background: profileSaveMessage.includes("sucesso") ? 'rgba(16,185,129,0.1)' : 'rgba(244,63,94,0.1)',
                  borderColor: profileSaveMessage.includes("sucesso") ? 'rgba(16,185,129,0.3)' : 'rgba(244,63,94,0.3)',
                  color: profileSaveMessage.includes("sucesso") ? '#34D399' : '#FB7185',
                }}
              >
                {profileSaveMessage}
              </div>
            )}

            <Button
              onClick={handleSaveProfile}
              isLoading={savingProfile}
              className="self-start"
            >
              Salvar Alterações
            </Button>

            {/* Password Change */}
            <PasswordChangeForm />

            {/* Delete Account */}
            <div className="pt-6 pb-2" style={{ borderTop: '1px solid rgba(244,63,94,0.2)' }}>
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-4 w-4 text-rose-500" />
                <span className="text-xs font-bold text-rose-500 uppercase tracking-wider">
                  Zona de Perigo
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowDeleteFlow(true)}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all cursor-pointer text-left group"
                style={{
                  background: 'rgba(244,63,94,0.06)',
                  border: '1px solid rgba(244,63,94,0.2)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(244,63,94,0.12)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(244,63,94,0.06)';
                }}
              >
                <div className="w-9 h-9 rounded-lg flex items-center justify-center text-rose-500 group-hover:scale-105 transition-transform" style={{ background: 'rgba(244,63,94,0.15)' }}>
                  <Trash2 className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <span className="text-sm font-bold" style={{ color: '#FB7185' }}>
                    Excluir Conta
                  </span>
                  <p className="text-[10px]" style={{ color: 'rgba(251,113,133,0.7)' }}>
                    Remover permanentemente sua conta e todos os dados
                  </p>
                </div>
                <ChevronRight className="h-4 w-4" style={{ color: 'rgba(244,63,94,0.4)' }} />
              </button>
            </div>

            {/* Logout */}
            <div className="pt-6 pb-2" style={{ borderTop: '1px solid var(--border-color)' }}>
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all cursor-pointer text-left group"
                style={{
                  background: 'rgba(244,63,94,0.06)',
                  border: '1px solid rgba(244,63,94,0.2)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(244,63,94,0.12)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(244,63,94,0.06)';
                }}
              >
                <div className="w-9 h-9 rounded-lg flex items-center justify-center text-rose-500 group-hover:scale-105 transition-transform" style={{ background: 'rgba(244,63,94,0.15)' }}>
                  <LogOut className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <span className="text-sm font-bold" style={{ color: '#FB7185' }}>
                    Sair da conta
                  </span>
                  <p className="text-[10px]" style={{ color: 'rgba(251,113,133,0.7)' }}>
                    Fazer logout do aplicativo
                  </p>
                </div>
                <ChevronRight className="h-4 w-4" style={{ color: 'rgba(244,63,94,0.4)' }} />
              </button>
            </div>
          </div>
        )}

        {/* ── CONTEÚDO: AVATARES ── */}
        {activeTab === "avatars" && (
          <div className="flex flex-col gap-7 max-h-[calc(90vh-12rem)] overflow-y-auto pr-1 scroll-smooth tab-enter">
            <AvatarSelector
              selectedCategory={selectedCategory}
              selectedVariant={selectedVariant}
              onSelect={(catId, variantId) => {
                setSelectedCategory(catId);
                setSelectedVariant(variantId);
              }}
              onCategoryChange={setSelectedCategory}
              customAvatarUrl={customAvatarUrl}
              onCustomUpload={(dataUrl) => {
                setCustomAvatarUrl(dataUrl || null);
              }}
            />

            {/* Avatar save message */}
            {avatarSaveMessage && (
              <div
                className={`p-3 rounded-xl text-sm font-medium border`}
                style={{
                  background: avatarSaveMessage.includes("sucesso") ? 'rgba(16,185,129,0.1)' : 'rgba(244,63,94,0.1)',
                  borderColor: avatarSaveMessage.includes("sucesso") ? 'rgba(16,185,129,0.3)' : 'rgba(244,63,94,0.3)',
                  color: avatarSaveMessage.includes("sucesso") ? '#34D399' : '#FB7185',
                }}
              >
                {avatarSaveMessage}
              </div>
            )}

            <Button
              onClick={handleSaveAvatar}
              isLoading={savingAvatar}
              className="self-start"
            >
              Salvar Avatar
            </Button>
          </div>
        )}

        {/* ── CONTEÚDO: CONFIGURAÇÕES ── */}
        {activeTab === "settings" && (
          <div className="tab-enter">
            <SettingsTab />
          </div>
        )}
      </Modal>

      {/* Delete Account Flow (3 modals) */}
      {showDeleteFlow && (
        <DeleteAccountModals
          userEmail={user?.email}
          onComplete={handleDeleteComplete}
        />
      )}
    </>
  );
};

export default ProfileModal;
