import React from 'react';
import {
  Moon,
  Sun,
  Globe,
  Calendar,
  Clock,
  Bell,
  Check,
} from 'lucide-react';
import { useUIStore } from '../../store/uiStore';
import { usePlanningSettingsStore } from '../../store/planningSettingsStore';

/* ───── Option Card Component ───── */
interface OptionCardProps {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}

const OptionCard: React.FC<OptionCardProps> = ({ selected, onClick, children, className = '' }) => (
  <button
    type="button"
    onClick={onClick}
    className={`text-left w-full cursor-pointer transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--border-active)] ${className}`}
    style={{
      borderRadius: '8px',
      border: selected ? '2px solid var(--border-active)' : '1px solid var(--border-color)',
      background: selected ? 'var(--bg-surface-hover)' : 'var(--bg-surface)',
    }}
    onMouseEnter={(e) => {
      if (!selected) {
        e.currentTarget.style.background = 'var(--bg-surface-hover)';
        e.currentTarget.style.borderColor = 'var(--text-secondary)';
      }
    }}
    onMouseLeave={(e) => {
      if (!selected) {
        e.currentTarget.style.background = 'var(--bg-surface)';
        e.currentTarget.style.borderColor = 'var(--border-color)';
      }
    }}
  >
    {children}
  </button>
);

/* ───── Section Title ───── */
interface SectionTitleProps {
  icon: React.ReactNode;
  label: string;
}

const SectionTitle: React.FC<SectionTitleProps> = ({ icon, label }) => (
  <label
    className="text-sm font-bold flex items-center gap-2"
    style={{ color: 'var(--text-primary)' }}
  >
    {icon}
    {label}
  </label>
);

/* ───── Checkmark Circle ───── */
const Checkmark: React.FC<{ visible: boolean }> = ({ visible }) => {
  if (!visible) return null;
  return (
    <div
      className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm"
      style={{ background: 'var(--primary)' }}
    >
      <Check className="h-3 w-3" style={{ color: 'var(--feedback-active)' }} strokeWidth={3} />
    </div>
  );
};

/* ───── Settings Tab ───── */
export const SettingsTab: React.FC = () => {
  const {
    theme,
    language,
    dateFormat,
    timeFormat,
    toggleTheme,
    setLanguage,
    setDateFormat,
    setTimeFormat,
  } = useUIStore();

  const notifSettings = usePlanningSettingsStore();

  return (
    <div className="flex flex-col gap-5 max-h-[calc(90vh-12rem)] overflow-y-auto pr-1">
      {/* ── Tema ── */}
      <div
        className="flex flex-col gap-3 p-5"
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
        }}
      >
        <SectionTitle
          icon={theme === 'dark'
            ? <Moon className="h-4 w-4" style={{ color: '#818CF8' }} />
            : <Sun className="h-4 w-4" style={{ color: '#F59E0B' }} />
          }
          label="Tema"
        />
        <div className="grid grid-cols-2 gap-3">
          {/* Claro */}
          <OptionCard
            selected={theme === 'light'}
            onClick={() => { if (theme !== 'light') toggleTheme(); }}
            className="flex items-center gap-3 px-4 py-3.5"
          >
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: '#FEF3C7', color: '#F59E0B' }}
            >
              <Sun className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-semibold block" style={{ color: 'var(--text-primary)' }}>
                Claro
              </span>
              <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                Tema claro padrão
              </p>
            </div>
            <Checkmark visible={theme === 'light'} />
          </OptionCard>

          {/* Escuro */}
          <OptionCard
            selected={theme === 'dark'}
            onClick={() => { if (theme !== 'dark') toggleTheme(); }}
            className="flex items-center gap-3 px-4 py-3.5"
          >
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: '#EDE9FE', color: '#818CF8' }}
            >
              <Moon className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-semibold block" style={{ color: 'var(--text-primary)' }}>
                Escuro
              </span>
              <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                Tema escuro noturno
              </p>
            </div>
            <Checkmark visible={theme === 'dark'} />
          </OptionCard>
        </div>
      </div>

      {/* ── Idioma ── */}
      <div
        className="flex flex-col gap-3 p-5"
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
        }}
      >
        <SectionTitle
          icon={<Globe className="h-4 w-4" style={{ color: '#38BDF8' }} />}
          label="Idioma"
        />
        <div className="relative">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full px-3.5 py-3 rounded-lg text-sm appearance-none cursor-pointer transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--border-active)]"
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--border-active)'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; }}
          >
            <option value="pt-BR">🇧🇷 Português (Brasil)</option>
            <option value="en-US">🇺🇸 English (US)</option>
            <option value="es">🇪🇸 Español</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--text-secondary)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* ── Formato de Data ── */}
      <div
        className="flex flex-col gap-3 p-5"
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
        }}
      >
        <SectionTitle
          icon={<Calendar className="h-4 w-4" style={{ color: '#10B981' }} />}
          label="Formato de Data"
        />
        <div className="grid grid-cols-3 gap-2">
          {[
            { value: 'dd/MM/yyyy', label: '31/12/2024', desc: 'Dia/Mês/Ano' },
            { value: 'MM/dd/yyyy', label: '12/31/2024', desc: 'Mês/Dia/Ano' },
            { value: 'yyyy-MM-dd', label: '2024-12-31', desc: 'Ano-Mês-Dia' },
          ].map((fmt) => (
            <OptionCard
              key={fmt.value}
              selected={dateFormat === fmt.value}
              onClick={() => setDateFormat(fmt.value)}
              className="flex flex-col items-center gap-1.5 px-3 py-3.5"
            >
              <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                {fmt.label}
              </span>
              <span className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                {fmt.desc}
              </span>
              {dateFormat === fmt.value && (
                <Checkmark visible={true} />
              )}
            </OptionCard>
          ))}
        </div>
      </div>

      {/* ── Formato de Hora ── */}
      <div
        className="flex flex-col gap-3 p-5"
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
        }}
      >
        <SectionTitle
          icon={<Clock className="h-4 w-4" style={{ color: '#F59E0B' }} />}
          label="Formato de Hora"
        />
        <div className="grid grid-cols-2 gap-3">
          {/* 24h */}
          <OptionCard
            selected={timeFormat === '24h'}
            onClick={() => setTimeFormat('24h')}
            className="flex items-center gap-3 px-4 py-3.5"
          >
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'var(--bg-surface-hover)', color: 'var(--text-primary)' }}
            >
              <span className="text-sm font-extrabold">24</span>
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-semibold block" style={{ color: 'var(--text-primary)' }}>
                24 horas
              </span>
              <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                14:30
              </p>
            </div>
            <Checkmark visible={timeFormat === '24h'} />
          </OptionCard>

          {/* 12h */}
          <OptionCard
            selected={timeFormat === '12h'}
            onClick={() => setTimeFormat('12h')}
            className="flex items-center gap-3 px-4 py-3.5"
          >
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'var(--bg-surface-hover)', color: 'var(--text-primary)' }}
            >
              <span className="text-sm font-extrabold">12</span>
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-semibold block" style={{ color: 'var(--text-primary)' }}>
                12 horas
              </span>
              <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                2:30 PM
              </p>
            </div>
            <Checkmark visible={timeFormat === '12h'} />
          </OptionCard>
        </div>
      </div>

      {/* ── Notificações ── */}
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

      <div className="pb-2" />
    </div>
  );
};

/* ───── Toggle Row ───── */
interface ToggleRowProps {
  icon: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  isFirst?: boolean;
}

const ToggleRow: React.FC<ToggleRowProps> = ({ icon, label, description, checked, onChange, isFirst }) => {
  return (
    <div
      className="flex items-center gap-3 py-3.5"
      style={{
        borderTop: isFirst ? 'none' : '1px solid var(--border-color)',
      }}
    >
      <span className="text-lg flex-shrink-0">{icon}</span>
      <div className="flex-grow min-w-0">
        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{label}</p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{description}</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className="relative w-11 h-6 rounded-full transition-all duration-200 cursor-pointer flex-shrink-0"
        style={{
          background: checked ? '#8b5cf6' : 'var(--border-color)',
        }}
        role="switch"
        aria-checked={checked}
      >
        <span
          className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200"
          style={{
            transform: checked ? 'translateX(20px)' : 'translateX(0)',
          }}
        />
      </button>
    </div>
  );
};

export default SettingsTab;
