import React, { useState } from "react";
import { User, Camera, Settings, Info } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "../../components/ui/Button.tsx";
import { Modal } from "../../components/ui/Modal.tsx";
import { AbasComScroll, type AbasComScrollTab } from "../../components/ui/AbasComScroll.tsx";
import { useAuth } from "../auth/hooks/useAuth";
import { api } from "../../core/api/client";
import { AVATAR_CATEGORIES, getAvatarUrl } from "./avatarCategories";
import { AvatarSelector } from "./AvatarSelector";
import { SettingsTab } from "./SettingsTab";
import { AboutTab } from "./AboutTab";
import { ProfileTabContent } from "./ProfileTabContent.tsx";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Tab = "profile" | "avatars" | "settings" | "about";

const TABS: AbasComScrollTab<Tab>[] = [
  { id: "profile", label: "Perfil", icon: User },
  { id: "avatars", label: "Avatares", icon: Camera },
  { id: "settings", label: "Configurações", icon: Settings },
  { id: "about", label: "Sobre", icon: Info },
];

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<Tab>("profile");

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

  const queryClient = useQueryClient();

  const [customAvatarUrl, setCustomAvatarUrl] = useState<string | null>(null);
  const [savingAvatar, setSavingAvatar] = useState(false);
  const [avatarSaveMessage, setAvatarSaveMessage] = useState<string | null>(null);

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
        avatarUrl = getAvatarUrl(currentCategory.style, currentVariant.seed);
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

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="" size="lg" scrollable={false}>
        <AbasComScroll<Tab> tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab}>
          {activeTab === "profile" && (
            <ProfileTabContent onClose={onClose} />
          )}

          {activeTab === "avatars" && (
            <div className="flex flex-col gap-5 sm:gap-7">
              <AvatarSelector
                selectedCategory={selectedCategory}
                selectedVariant={selectedVariant}
                onSelect={(catId, variantId) => {
                  setSelectedCategory(catId);
                  setSelectedVariant(variantId);
                }}
                onCategoryChange={setSelectedCategory}
                customAvatarUrl={customAvatarUrl}
                onCustomUpload={(dataUrl) => setCustomAvatarUrl(dataUrl || null)}
              />

              {avatarSaveMessage && (
                <div
                  className="p-3 rounded-xl text-sm font-medium border"
                  style={{
                    background: avatarSaveMessage.includes("sucesso") ? 'rgba(16,185,129,0.1)' : 'rgba(244,63,94,0.1)',
                    borderColor: avatarSaveMessage.includes("sucesso") ? 'rgba(16,185,129,0.3)' : 'rgba(244,63,94,0.3)',
                    color: avatarSaveMessage.includes("sucesso") ? '#34D399' : '#FB7185',
                  }}
                >
                  {avatarSaveMessage}
                </div>
              )}

              <Button onClick={handleSaveAvatar} isLoading={savingAvatar} className="self-start">
                Salvar Avatar
              </Button>
            </div>
          )}

          {activeTab === "settings" && (
            <SettingsTab />
          )}

          {activeTab === "about" && (
            <AboutTab />
          )}
        </AbasComScroll>
      </Modal>
    </>
  );
};

export default ProfileModal;
