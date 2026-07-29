import React from 'react';
import { Bell } from 'lucide-react';
import { usePlanningSettingsStore } from '../../../store/planningSettingsStore.ts';
import { SectionTitle } from '../components/SectionTitle.tsx';
import { ToggleRow } from '../components/ToggleRow.tsx';

export const NotificationSection: React.FC = () => {
  const notifSettings = usePlanningSettingsStore();

  return (
    <div
      className="flex flex-col gap-3 p-5"
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-color)',
        borderRadius: '8px',
      }}
    >
      <SectionTitle
        icon={<Bell className="h-4 w-4" style={{ color: '#F43F5E' }} />}
        label="Notificações"
      />
      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
        Controle quais notificações você deseja receber
      </p>
      <div className="flex flex-col">
        <ToggleRow
          icon="📅"
          label="Eventos da Agenda"
          description="Notificar sobre eventos programados para hoje"
          checked={notifSettings.notifyEvents}
          onChange={notifSettings.setNotifyEvents}
          isFirst
        />
        <ToggleRow
          icon="🎯"
          label="Metas Próximas do Prazo"
          description="Notificar quando metas estiverem perto do vencimento"
          checked={notifSettings.notifyGoals}
          onChange={notifSettings.setNotifyGoals}
        />
        <ToggleRow
          icon="🍅"
          label="Pomodoro Concluído"
          description="Notificar ao finalizar uma sessão de foco"
          checked={notifSettings.notifyPomodoro}
          onChange={notifSettings.setNotifyPomodoro}
        />
        <ToggleRow
          icon="🖥️"
          label="Notificações no Navegador"
          description="Exibir notificações nativas mesmo com o app em segundo plano"
          checked={notifSettings.notifyBrowser}
          onChange={notifSettings.setNotifyBrowser}
        />
      </div>
    </div>
  );
};
