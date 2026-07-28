import React from 'react';
import { PageContainer } from '../../../components/ui/PageContainer.tsx';
import {
  Palette,
  Check,
} from 'lucide-react';
import { usePlanningSettingsStore, ACCENT_COLORS } from '../../../store/planningSettingsStore.ts';

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


      <div className="pb-8" />
    </PageContainer>
  );
};

export default PlanningSettingsView;
