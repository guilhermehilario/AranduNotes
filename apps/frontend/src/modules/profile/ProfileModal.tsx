import React, { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "../../components/ui/Button.tsx";
import { Modal } from "../../components/ui/Modal.tsx";
import { useAuth } from "../auth/hooks/useAuth";
import { api } from "../../core/api/client";
import { AVATAR_CATEGORIES, getAvatarUrl } from "./avatarCategories";
import { AvatarSelector } from "./AvatarSelector";
import { SettingsTab } from "./SettingsTab";
import { ProfileTabBar } from "./ProfileTabBar.tsx";
import { ProfileTabContent } from "./ProfileTabContent.tsx";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Tab = "profile" | "avatars" | "settings";

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

  // Reseta variantes de avatar ao abrir o modal (mantendo sincronia)
  useEffect(() => {
    if (isOpen && user?.avatarUrl) {
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
      <Modal isOpen={isOpen} onClose={onClose} title="" size="lg">
        <style>{`
          @keyframes tab-fade-slide {
            from { opacity: 0; transform: translateY(12px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .tab-enter { animation: tab-fade-slide 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
        `}</style>

        <ProfileTabBar activeTab={activeTab} onTabChange={setActiveTab} />

        {activeTab === "profile" && (
          <div className="tab-enter">
            <ProfileTabContent onClose={onClose} />
          </div>
        )}

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
          <div className="tab-enter">
            <SettingsTab />
          </div>
        )}
      </Modal>
    </>
  );
};

export default ProfileModal;
