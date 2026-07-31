import React from "react";
import { Bell } from "lucide-react";
import { useNotificationStore } from "../../store/notificationStore";

function formatTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "agora";
  if (minutes === 1) return "1 min";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours === 1) return "1 hora";
  return `${hours} horas`;
}

interface NotificationPanelProps {
  show: boolean;
  onClose: () => void;
  /** Quando true, renderiza sem backdrop e sem posicionamento absoluto (para ser embutido em um dropdown combinado). */
  embedded?: boolean;
}

export const NotificationPanel: React.FC<NotificationPanelProps> = ({
  show,
  onClose,
  embedded = false,
}) => {
  const notifications = useNotificationStore((s) => s.notifications);
  const acknowledge = useNotificationStore((s) => s.acknowledge);
  const acknowledgeAll = useNotificationStore((s) => s.acknowledgeAll);

  if (!show) return null;

  return (
    <>
      {/* Backdrop */}
      {!embedded && <div className="fixed inset-0 z-40" onClick={onClose} />}
      <div
        className={
          embedded
            ? 'w-full'
            : 'absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-2xl shadow-xl z-50 overflow-hidden animate-in slide-in-from-top-2 fade-in duration-200'
        }
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        }}
      >
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ borderBottom: '1px solid var(--border-color)' }}
        >
          <h4 className="text-sm font-heading font-bold" style={{ color: 'var(--text-primary)' }}>
            Notificações
          </h4>
          {notifications.filter((n) => !n.acknowledged).length > 0 && (
            <button
              type="button"
              onClick={acknowledgeAll}
              className="text-xs font-semibold transition-colors cursor-pointer"
              style={{ color: 'var(--primary)' }}
            >
              Limpar todas
            </button>
          )}
        </div>

        <div className={embedded ? 'overflow-y-auto' : 'max-h-80 overflow-y-auto'}>
          {notifications.filter((n) => !n.acknowledged).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
              <Bell className="h-8 w-8 mb-2" style={{ color: 'var(--text-secondary)' }} />
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Nenhuma notificação no momento
              </p>
            </div>
          ) : (
            <div className="flex flex-col">
              {notifications
                .filter((n) => !n.acknowledged)
                .sort((a, b) => b.notifiedAt - a.notifiedAt)
                .map((notif) => (
                  <button
                    key={notif.id}
                    type="button"
                    onClick={() => acknowledge(notif.id)}
                    className="flex items-start gap-3 px-4 py-3 text-left cursor-pointer last:border-b-0 hover:bg-[var(--bg-surface-hover)] transition-colors"
                    style={{
                      borderBottom: '1px solid var(--border-color)',
                    }}
                  >
                    <span className="text-lg flex-shrink-0 mt-0.5">
                      {notif.type === "event"
                        ? "📅"
                        : notif.type === "goal"
                          ? "🎯"
                          : "🍅"}
                    </span>
                    <div className="flex-grow min-w-0">
                      <p className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                        {notif.title}
                      </p>
                      <p className="text-xs mt-0.5 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                        {notif.message}
                      </p>
                    </div>
                    <span className="text-[10px] flex-shrink-0" style={{ color: 'var(--text-secondary)' }}>
                      {formatTimeAgo(notif.notifiedAt)}
                    </span>
                  </button>
                ))}
            </div>
          )}
        </div>

        <div
          className="px-4 py-2.5"
          style={{
            background: 'var(--bg-surface-hover)',
            borderTop: '1px solid var(--border-color)',
          }}
        >
          <p className="text-[11px] text-center" style={{ color: 'var(--text-secondary)' }}>
            As notificações são verificadas a cada 1 minuto
          </p>
        </div>
      </div>
    </>
  );
};

export default NotificationPanel;
