import React, { useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import {
  CalendarDays,
  Timeline,
  Target,
  Timer,
  ListChecks,
  Palette,
  Check,
  Settings,
} from 'lucide-react';
import { PageContainer } from '../../../components/ui/PageContainer.tsx';
import { usePlanningSettingsStore, ACCENT_COLORS } from '../../../store/planningSettingsStore.ts';
import { AgendaTab } from '../components/AgendaTab.tsx';
import { CalendarTab } from '../components/CalendarTab.tsx';
import { CronogramaTab } from '../components/CronogramaTab.tsx';
import { MetasTab } from '../components/MetasTab.tsx';
import { PomodoroTab } from '../components/PomodoroTab.tsx';

type TabKey = 'agenda' | 'calendar' | 'cronograma' | 'metas' | 'pomodoro';

const TAB_INFO: Record<TabKey, { label: string; icon: React.FC<{ className?: string }> }> = {
  agenda: { label: 'Agenda', icon: ListChecks },
  calendar: { label: 'Calendário', icon: CalendarDays },
  cronograma: { label: 'Cronograma', icon: Timeline },
  metas: { label: 'Metas', icon: Target },
  pomodoro: { label: 'Pomodoro', icon: Timer },
};

const TAB_COMPONENTS: Record<TabKey, React.FC> = {
  agenda: AgendaTab,
  calendar: CalendarTab,
  cronograma: CronogramaTab,
  metas: MetasTab,
  pomodoro: PomodoroTab,
};

export const PlanningView: React.FC = () => {
  const { tab } = useParams<{ tab?: string }>();
  const activeTab = (tab as TabKey) || 'agenda';
  const [showAccentColors, setShowAccentColors] = useState(false);

  const settings = usePlanningSettingsStore();

  // Validate tab — redirect to agenda if invalid
  if (!TAB_INFO[activeTab]) {
    return <Navigate to="/planning/agenda" replace />;
  }

  const ActiveComponent = TAB_COMPONENTS[activeTab];

  return (
    <PageContainer>
      {/* Header */}
      <div>
        <p className="text-slate-500 dark:text-dark-350">
          Organize seus estudos com agenda, cronograma, metas e pomodoro
        </p>
      </div>

      {/* ── Cor de Destaque (Collapsible) ── */}
      <div>
        <button
          type="button"
          onClick={() => setShowAccentColors(!showAccentColors)}
          className="flex items-center gap-2 w-full px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer"
          style={{
            background: showAccentColors ? 'var(--bg-surface-hover)' : 'transparent',
            color: 'var(--text-secondary)',
          }}
        >
          <Palette className="h-3.5 w-3.5" />
          Cor de Destaque
          <span
            className={`ml-auto transition-transform duration-200 ${showAccentColors ? 'rotate-180' : ''}`}
          >
            <Settings className="h-3.5 w-3.5" />
          </span>
        </button>

        {showAccentColors && (
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-3">
            {ACCENT_COLORS.map((color) => (
              <button
                key={color.id}
                type="button"
                onClick={() => settings.setAccentColor(color.id)}
                className={`flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl border-2 transition-all cursor-pointer ${
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
                  className="w-7 h-7 rounded-full ring-2 ring-offset-2 ring-offset-white dark:ring-offset-dark-900 transition-all"
                  style={{ backgroundColor: color.hex }}
                />
                <span className={`text-[10px] font-semibold ${
                  settings.accentColor === color.id ? 'text-slate-800 dark:text-dark-100' : 'text-slate-500 dark:text-dark-400'
                }`}>
                  {color.label}
                </span>
                {settings.accentColor === color.id && (
                  <Check className="h-3 w-3" style={{ color: color.hex }} />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="min-h-[60vh]">
        <ActiveComponent />
      </div>
    </PageContainer>
  );
};

export default PlanningView;
