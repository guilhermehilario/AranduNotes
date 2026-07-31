import React from 'react';
import {
  Bell,
  User as UserIcon,
  ClipboardList,
} from 'lucide-react';
import { SaveStatusIndicator } from '../../../ui/SaveStatusIndicator.tsx';
import { NotificationPanel } from '../../../ui/NotificationPanel.tsx';
import { ProfileModal } from '../../../../modules/profile/ProfileModal.tsx';
import { Tooltip } from '../../../ui/Tooltip.tsx';
import { ClipboardManager } from '../../../../modules/clipboard/components/ClipboardManager.tsx';
import { useEditorStatusStore } from '../../../../store/editorStatusStore.ts';
import { useNotificationStore } from '../../../../store/notificationStore.ts';
import { useClipboardStore } from '../../../../store/clipboardStore.ts';
import type { User } from '../../../../modules/auth/types';

interface HeaderActionsProps {
  user: User | null;
}

export const HeaderActions: React.FC<HeaderActionsProps> = ({ user }) => {
  const editorStatus = useEditorStatusStore();
  const notificationCount = useNotificationStore((s) => s.count);
  const clipboardItems = useClipboardStore((s) => s.items);
  const showClipboard = useClipboardStore((s) => s.isOpen);
  const setClipboardOpen = useClipboardStore((s) => s.setOpen);
  const toggleClipboard = useClipboardStore((s) => s.toggleOpen);

  const [showNotifications, setShowNotifications] = React.useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = React.useState(false);
  const [showMobileMenu, setShowMobileMenu] = React.useState(false);
  const notifRef = React.useRef<HTMLDivElement>(null);
  const clipboardRef = React.useRef<HTMLDivElement>(null);

  return (
    <>
      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
        {/* Editor Status - desktop */}
        {editorStatus.visible && (
          <div className="hidden sm:flex items-center gap-3 text-xs font-semibold mr-1">
            {editorStatus.lastUpdate && (
              <span className="flex items-center gap-1.5 text-slate-400 dark:text-dark-400 whitespace-nowrap">
                {new Date(editorStatus.lastUpdate).toLocaleString('pt-BR')}
              </span>
            )}
            <SaveStatusIndicator status={editorStatus.saveStatus} />
          </div>
        )}

        {/* Editor Status - mobile (just dot) */}
        {editorStatus.visible && (
          <div className="sm:hidden">
            <SaveStatusIndicator status={editorStatus.saveStatus} />
          </div>
        )}

        {/* Clipboard Manager - desktop only */}
        <div className="hidden sm:relative sm:block" ref={clipboardRef}>
          <Tooltip content="Histórico de cópia (Ctrl+Shift+V)" position="bottom">
            <button
              type="button"
              onClick={toggleClipboard}
              className="relative p-2 rounded-xl text-slate-500 dark:text-dark-400 hover:bg-slate-100 dark:hover:bg-dark-800 transition-all cursor-pointer"
            >
              <ClipboardList className="h-5 w-5" />
              {clipboardItems.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-brand-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-sm animate-in zoom-in duration-200">
                  {clipboardItems.length > 9 ? '9+' : clipboardItems.length}
                </span>
              )}
            </button>
          </Tooltip>

          <ClipboardManager
            show={showClipboard}
            onClose={() => setClipboardOpen(false)}
          />
        </div>

        {/* Notification Bell - desktop only */}
        <div className="relative hidden sm:block" ref={notifRef}>
          <button
            type="button"
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-xl text-slate-500 dark:text-dark-400 hover:bg-slate-100 dark:hover:bg-dark-800 transition-all cursor-pointer"
            title="Notificações"
          >
            <Bell className="h-5 w-5" />
            {notificationCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm shadow-rose-500/30 animate-in zoom-in duration-200">
                {notificationCount > 9 ? '9+' : notificationCount}
              </span>
            )}
          </button>

          <NotificationPanel
            show={showNotifications}
            onClose={() => setShowNotifications(false)}
          />
        </div>

        {/* Mobile - combined menu (notifications + clipboard) */}
        {/* Painel usa fixed (top-14 = altura do header mobile h-14); manter alinhado com AppHeader */}
        <div className="sm:hidden">
          <button
            type="button"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="relative p-2 rounded-xl text-slate-500 dark:text-dark-400 hover:bg-slate-100 dark:hover:bg-dark-800 transition-all cursor-pointer"
            title="Notificações e histórico de cópia"
            aria-expanded={showMobileMenu}
            aria-haspopup="true"
          >
            <Bell className="h-5 w-5" />
            {(notificationCount > 0 || clipboardItems.length > 0) && (
              <span
                className={`absolute -top-0.5 -right-0.5 min-w-5 h-5 px-1 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm animate-in zoom-in duration-200 ${
                  notificationCount > 0
                    ? 'bg-rose-500 shadow-rose-500/30'
                    : 'bg-brand-500'
                }`}
              >
                {notificationCount + clipboardItems.length > 9
                  ? '9+'
                  : notificationCount + clipboardItems.length}
              </span>
            )}
          </button>

          {showMobileMenu && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowMobileMenu(false)}
              />
              <div
                className="fixed right-2 top-14 mt-2 w-80 max-w-[calc(100vw-1rem)] rounded-2xl shadow-xl z-50 max-h-[70dvh] overflow-y-auto animate-in slide-in-from-top-2 fade-in duration-200"
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-color)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                }}
              >
                <ClipboardManager
                  show={showMobileMenu}
                  onClose={() => setShowMobileMenu(false)}
                  embedded
                />
                <NotificationPanel
                  show={showMobileMenu}
                  onClose={() => setShowMobileMenu(false)}
                  embedded
                />
              </div>
            </>
          )}
        </div>

        {/* Profile Button */}
        <button
          type="button"
          onClick={() => setIsProfileModalOpen(true)}
          className="flex items-center gap-2 p-1.5 pl-2 pr-2.5 rounded-xl text-slate-500 dark:text-dark-400 hover:bg-slate-100 dark:hover:bg-dark-800 transition-all cursor-pointer group ml-0.5 sm:ml-1"
          title="Perfil"
        >
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 dark:text-brand-400 overflow-hidden flex-shrink-0 group-hover:ring-2 ring-brand-300 transition-all">
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user?.name || 'Avatar'}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <UserIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            )}
          </div>
        </button>
      </div>

      {/* Profile Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </>
  );
};
