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
}

export const NotificationPanel: React.FC<NotificationPanelProps> = ({
  show,
  onClose,
}) => {
  const notifications = useNotificationStore((s) => s.notifications);
  const acknowledge = useNotificationStore((s) => s.acknowledge);
  const acknowledgeAll = useNotificationStore((s) => s.acknowledgeAll);

  if (!show) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-800 rounded-2xl shadow-xl z-50 overflow-hidden animate-in slide-in-from-top-2 fade-in duration-200">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-dark-800">
          <h4 className="text-sm font-heading font-bold text-slate-800 dark:text-dark-100">
            Notificações
          </h4>
          {notifications.filter((n) => !n.acknowledged).length > 0 && (
            <button
              type="button"
              onClick={acknowledgeAll}
              className="text-xs font-semibold text-brand-500 hover:text-brand-600 transition-colors cursor-pointer"
            >
              Limpar todas
            </button>
          )}
        </div>

        <div className="max-h-80 overflow-y-auto">
          {notifications.filter((n) => !n.acknowledged).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
              <Bell className="h-8 w-8 text-slate-300 dark:text-dark-600 mb-2" />
              <p className="text-sm text-slate-400 dark:text-dark-400">
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
                    className="flex items-start gap-3 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-dark-800/60 transition-colors border-b border-slate-50 dark:border-dark-800/40 last:border-b-0 cursor-pointer"
                  >
                    <span className="text-lg flex-shrink-0 mt-0.5">
                      {notif.type === "event"
                        ? "📅"
                        : notif.type === "goal"
                          ? "🎯"
                          : "🍅"}
                    </span>
                    <div className="flex-grow min-w-0">
                      <p className="text-xs font-bold text-slate-800 dark:text-dark-100">
                        {notif.title}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-dark-350 mt-0.5 line-clamp-2">
                        {notif.message}
                      </p>
                    </div>
                    <span className="text-[10px] text-slate-400 dark:text-dark-500 flex-shrink-0">
                      {formatTimeAgo(notif.notifiedAt)}
                    </span>
                  </button>
                ))}
            </div>
          )}
        </div>

        <div className="px-4 py-2.5 border-t border-slate-100 dark:border-dark-800 bg-slate-50/50 dark:bg-dark-950/30">
          <p className="text-[11px] text-slate-400 dark:text-dark-500 text-center">
            As notificações são verificadas a cada 1 minuto
          </p>
        </div>
      </div>
    </>
  );
};

export default NotificationPanel;
