import React from 'react';
import { User, Camera, Settings, Info } from 'lucide-react';

type Tab = 'profile' | 'avatars' | 'settings' | 'about';

interface ProfileTabBarProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

const TABS: { id: Tab; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'profile', label: 'Perfil', icon: User },
  { id: 'avatars', label: 'Avatares', icon: Camera },
  { id: 'settings', label: 'Configurações', icon: Settings },
  { id: 'about', label: 'Sobre', icon: Info },
];

export const ProfileTabBar: React.FC<ProfileTabBarProps> = ({ activeTab, onTabChange }) => {
  return (
    <div
      className="flex -mx-4 sm:-mx-6 px-3 sm:px-6 mb-6 sticky top-0 z-10 rounded-t-2xl overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      style={{
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-color)',
      }}
    >
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`relative flex items-center gap-1.5 sm:gap-2 pb-4 px-2.5 sm:px-4 shrink-0 whitespace-nowrap font-heading font-bold text-xs sm:text-sm tracking-wide transition-all duration-300 cursor-pointer ${
              isActive
                ? 'text-brand-500'
                : 'hover:opacity-80 text-[var(--text-secondary)]'
            }`}
          >
            <Icon className="h-4 w-4" />
            {tab.label}
            <span
              className={`absolute bottom-0 left-0 right-0 h-0.5 rounded-full transition-all duration-300 ${
                isActive
                  ? 'bg-brand-500 scale-x-100'
                  : 'bg-transparent scale-x-0'
              }`}
            />
          </button>
        );
      })}
    </div>
  );
};
