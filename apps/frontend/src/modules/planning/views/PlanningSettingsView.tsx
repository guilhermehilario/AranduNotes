import React from 'react';
import { PageContainer } from '../../../components/ui/PageContainer.tsx';
import {
  Palette,
  Timer,
  Bell,
  Check,
  RotateCcw,
} from 'lucide-react';
import { usePlanningSettingsStore, ACCENT_COLORS } from '../../../store/planningSettingsStore.ts';
import { POMODORO_DURATION, BREAK_DURATION } from '../../../store/pomodoroStore.ts';

export const PlanningSettingsView: React.FC = () => {
  const settings = usePlanningSettingsStore();

  return (
    <PageContainer gap="8">
      {/* ── Cor de Destaque ── */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-violet-50 dark:bg-violet-950/20 flex items-center justify-center text-violet-500">
            <Palette className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-heading font-bold text-slate-800 dark:text-dark-100">
              Cor de Destaque
            </h3>
            <p className="text-xs text-slate-500 dark:text-dark-350">
              Personalize as cores do módulo de planejamento
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {ACCENT_COLORS.map((color) => (
            <button
              key={color.id}
              type="button"
              onClick={() => settings.setAccentColor(color.id)}
              className={`flex flex-col items-center gap-2 px-3 py-4 rounded-xl border-2 transition-all cursor-pointer ${
                settings.accentColor === color.id
                  ? 'border-current bg-opacity-10'
                  : 'border-slate-200 dark:border-dark-700 hover:border-slate-300 dark:hover:border-dark-600'
              }`}
              style={{
                borderColor: settings.accentColor === color.id ? color.hex : undefined,
                backgroundColor: settings.accentColor === color.id ? `${color.hex}15` : undefined,
              }}
            >
              <div
                className="w-8 h-8 rounded-full ring-2 ring-offset-2 ring-offset-white dark:ring-offset-dark-900 transition-all"
                style={{ backgroundColor: color.hex }}
              />
              <span className={`text-xs font-semibold ${
                settings.accentColor === color.id ? 'text-slate-800 dark:text-dark-100' : 'text-slate-500 dark:text-dark-400'
              }`}>
                {color.label}
              </span>
              {settings.accentColor === color.id && (
                <Check className="h-3.5 w-3.5" style={{ color: color.hex }} />
              )}
            </button>
          ))}
        </div>
      </section>

      {/* ── Durações do Pomodoro ── */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-950/20 flex items-center justify-center text-amber-500">
            <Timer className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-heading font-bold text-slate-800 dark:text-dark-100">
              Durações do Pomodoro
            </h3>
            <p className="text-xs text-slate-500 dark:text-dark-350">
              Ajuste o tempo de foco e pausa
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Foco */}
          <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-800 rounded-2xl p-5">
            <label className="text-xs font-bold text-slate-500 dark:text-dark-400 uppercase tracking-wide block mb-3">
              Tempo de Foco
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => settings.setPomodoroDuration(Math.max(5, settings.pomodoroDuration - 5))}
                className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-dark-800 text-slate-600 dark:text-dark-300 hover:bg-slate-200 dark:hover:bg-dark-700 font-bold text-lg transition-all cursor-pointer flex items-center justify-center"
              >
                −
              </button>
              <div className="flex-1 text-center">
                <span className="text-3xl font-heading font-extrabold text-violet-500">
                  {settings.pomodoroDuration}
                </span>
                <span className="text-sm text-slate-400 dark:text-dark-400 ml-1">min</span>
              </div>
              <button
                type="button"
                onClick={() => settings.setPomodoroDuration(Math.min(60, settings.pomodoroDuration + 5))}
                className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-dark-800 text-slate-600 dark:text-dark-300 hover:bg-slate-200 dark:hover:bg-dark-700 font-bold text-lg transition-all cursor-pointer flex items-center justify-center"
              >
                +
              </button>
            </div>
            <button
              type="button"
              onClick={() => settings.setPomodoroDuration(POMODORO_DURATION)}
              className="mt-3 text-xs text-slate-400 hover:text-violet-500 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="h-3 w-3" /> Restaurar padrão ({POMODORO_DURATION}min)
            </button>
          </div>

          {/* Pausa */}
          <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-800 rounded-2xl p-5">
            <label className="text-xs font-bold text-slate-500 dark:text-dark-400 uppercase tracking-wide block mb-3">
              Tempo de Pausa
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => settings.setBreakDuration(Math.max(1, settings.breakDuration - 1))}
                className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-dark-800 text-slate-600 dark:text-dark-300 hover:bg-slate-200 dark:hover:bg-dark-700 font-bold text-lg transition-all cursor-pointer flex items-center justify-center"
              >
                −
              </button>
              <div className="flex-1 text-center">
                <span className="text-3xl font-heading font-extrabold text-emerald-500">
                  {settings.breakDuration}
                </span>
                <span className="text-sm text-slate-400 dark:text-dark-400 ml-1">min</span>
              </div>
              <button
                type="button"
                onClick={() => settings.setBreakDuration(Math.min(30, settings.breakDuration + 1))}
                className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-dark-800 text-slate-600 dark:text-dark-300 hover:bg-slate-200 dark:hover:bg-dark-700 font-bold text-lg transition-all cursor-pointer flex items-center justify-center"
              >
                +
              </button>
            </div>
            <button
              type="button"
              onClick={() => settings.setBreakDuration(BREAK_DURATION)}
              className="mt-3 text-xs text-slate-400 hover:text-emerald-500 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="h-3 w-3" /> Restaurar padrão ({BREAK_DURATION}min)
            </button>
          </div>
        </div>
      </section>

      {/* ── Notificações ── */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-rose-50 dark:bg-rose-950/20 flex items-center justify-center text-rose-500">
            <Bell className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-heading font-bold text-slate-800 dark:text-dark-100">
              Notificações
            </h3>
            <p className="text-xs text-slate-500 dark:text-dark-350">
              Controle quais notificações você deseja receber
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-800 rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-dark-800">
          {/* Eventos */}
          <ToggleRow
            icon="📅"
            label="Eventos da Agenda"
            description="Notificar sobre eventos programados para hoje"
            checked={settings.notifyEvents}
            onChange={settings.setNotifyEvents}
          />

          {/* Metas */}
          <ToggleRow
            icon="🎯"
            label="Metas Próximas do Prazo"
            description="Notificar quando metas estiverem perto do vencimento"
            checked={settings.notifyGoals}
            onChange={settings.setNotifyGoals}
          />

          {/* Pomodoro */}
          <ToggleRow
            icon="🍅"
            label="Pomodoro Concluído"
            description="Notificar ao finalizar uma sessão de foco"
            checked={settings.notifyPomodoro}
            onChange={settings.setNotifyPomodoro}
          />

          {/* Navegador */}
          <ToggleRow
            icon="🖥️"
            label="Notificações no Navegador"
            description="Exibir notificações nativas mesmo com o app em segundo plano"
            checked={settings.notifyBrowser}
            onChange={settings.setNotifyBrowser}
          />
        </div>
      </section>

      <div className="pb-8" />
    </PageContainer>
  );
};

interface ToggleRowProps {
  icon: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}

const ToggleRow: React.FC<ToggleRowProps> = ({ icon, label, description, checked, onChange }) => {
  return (
    <div className="flex items-center gap-3 px-5 py-4">
      <span className="text-lg flex-shrink-0">{icon}</span>
      <div className="flex-grow min-w-0">
        <p className="text-sm font-semibold text-slate-800 dark:text-dark-100">{label}</p>
        <p className="text-xs text-slate-500 dark:text-dark-350">{description}</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-all duration-200 cursor-pointer flex-shrink-0 ${
          checked ? 'bg-violet-500' : 'bg-slate-300 dark:bg-dark-700'
        }`}
        role="switch"
        aria-checked={checked}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
};

export default PlanningSettingsView;
