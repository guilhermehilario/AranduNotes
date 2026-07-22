import React, { useState, useCallback, useEffect } from "react";
import { User, Settings, LogOut, ChevronRight, AlertTriangle, Trash2 } from "lucide-react";
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

type Tab = "profile" | "settings";

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
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const handleSaveProfile = async () => {
    setSaving(true);
    setSaveMessage(null);
    try {
      const currentCategory =
        AVATAR_CATEGORIES.find((c) => c.id === selectedCategory) ||
        AVATAR_CATEGORIES[0];
      const currentVariant =
        currentCategory.variants.find((v) => v.id === selectedVariant) ||
        currentCategory.variants[0];
      const avatarUrl = getAvatarUrl(
        currentCategory.style,
        currentVariant.seed,
      );
      await api.put("/auth/profile", { name, avatarUrl });
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
        {/* Tabs */}
        <div className="flex border-b border-slate-100 dark:border-dark-800/60 -mx-6 px-6 mb-6 sticky top-0 bg-white dark:bg-dark-900 z-10 rounded-t-2xl">
          <button
            onClick={() => setActiveTab("profile")}
            className={`flex items-center gap-2 pb-4 px-4 font-heading font-bold text-sm tracking-wide border-b-2 transition-all cursor-pointer ${
              activeTab === "profile"
                ? "border-brand-500 text-brand-500"
                : "border-transparent text-slate-500 dark:text-dark-400 hover:text-slate-700"
            }`}
          >
            <User className="h-4 w-4" /> Perfil
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`flex items-center gap-2 pb-4 px-4 font-heading font-bold text-sm tracking-wide border-b-2 transition-all cursor-pointer ${
              activeTab === "settings"
                ? "border-brand-500 text-brand-500"
                : "border-transparent text-slate-500 dark:text-dark-400 hover:text-slate-700"
            }`}
          >
            <Settings className="h-4 w-4" /> Configurações
          </button>
        </div>

        {/* ── CONTEÚDO: PERFIL ── */}
        {activeTab === "profile" && (
          <div className="flex flex-col gap-7 max-h-[calc(90vh-12rem)] overflow-y-auto pr-1">
            {/* User info */}
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center overflow-hidden border-2 border-brand-200 dark:border-brand-800 flex-shrink-0">
                <img
                  src={user?.avatarUrl || ""}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 rounded-full ring-2 ring-white/50 dark:ring-dark-900/50" />
              </div>
              <div>
                <h2 className="text-lg font-heading font-extrabold text-slate-900 dark:text-dark-50">
                  {user?.name || "Meu Perfil"}
                </h2>
                <p className="text-xs text-slate-500 dark:text-dark-400 mt-0.5">
                  {user?.email}
                </p>
              </div>
            </div>

            {/* Avatar Selection */}
            <AvatarSelector
              selectedCategory={selectedCategory}
              selectedVariant={selectedVariant}
              onSelect={(catId, variantId) => {
                setSelectedCategory(catId);
                setSelectedVariant(variantId);
              }}
              onCategoryChange={setSelectedCategory}
            />

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
                className={`p-3 rounded-xl text-sm font-medium ${
                  saveMessage.includes("sucesso")
                    ? "bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400"
                    : "bg-rose-50 text-rose-600 border border-rose-100 dark:bg-rose-950/20 dark:text-rose-400"
                }`}
              >
                {saveMessage}
              </div>
            )}

            <Button
              onClick={handleSaveProfile}
              isLoading={saving}
              className="self-start"
            >
              Salvar Alterações
            </Button>

            {/* Password Change */}
            <PasswordChangeForm />

            {/* Delete Account */}
            <div className="border-t border-red-100 dark:border-red-900/30 pt-6 pb-2">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-4 w-4 text-rose-500" />
                <span className="text-xs font-bold text-rose-500 uppercase tracking-wider">
                  Zona de Perigo
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowDeleteFlow(true)}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-rose-50/50 dark:bg-rose-950/10 border border-rose-200 dark:border-rose-900/30 hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:border-rose-300 dark:hover:border-rose-800/40 transition-all cursor-pointer text-left group"
              >
                <div className="w-9 h-9 rounded-lg bg-rose-100 dark:bg-rose-950/30 flex items-center justify-center text-rose-500 group-hover:scale-105 transition-transform">
                  <Trash2 className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <span className="text-sm font-bold text-rose-600 dark:text-rose-400">
                    Excluir Conta
                  </span>
                  <p className="text-[10px] text-rose-400 dark:text-rose-500/70">
                    Remover permanentemente sua conta e todos os dados
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-rose-300 dark:text-rose-700" />
              </button>
            </div>

            {/* Logout */}
            <div className="border-t border-slate-100 dark:border-dark-800/60 pt-6 pb-2">
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-rose-50/50 dark:bg-rose-950/10 border border-rose-100 dark:border-rose-900/30 hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:border-rose-200 dark:hover:border-rose-800/40 transition-all cursor-pointer text-left group"
              >
                <div className="w-9 h-9 rounded-lg bg-rose-100 dark:bg-rose-950/30 flex items-center justify-center text-rose-500 group-hover:scale-105 transition-transform">
                  <LogOut className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <span className="text-sm font-bold text-rose-600 dark:text-rose-400">
                    Sair da conta
                  </span>
                  <p className="text-[10px] text-rose-400 dark:text-rose-500/70">
                    Fazer logout do aplicativo
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-rose-300 dark:text-rose-700" />
              </button>
            </div>
          </div>
        )}

        {/* ── CONTEÚDO: CONFIGURAÇÕES ── */}
        {activeTab === "settings" && <SettingsTab />}
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
