import React from 'react';
import { PageContainer } from '../../../components/ui/PageContainer.tsx';
import {
  Palette,
  Timer,
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

      <div className="pb-8" />
    </PageContainer>
  );
};

export default PlanningSettingsView;
