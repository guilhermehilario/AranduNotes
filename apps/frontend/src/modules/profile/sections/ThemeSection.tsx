import React from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { useUIStore, resolveTheme } from '../../../store/uiStore.ts';
import type { ThemePreference } from '../../../store/uiStore.ts';
import { useToastStore } from '../../../store/toastStore.ts';
import { extractApiError } from '../../../utils/api-errors.ts';
import { authService } from '../../auth/services/authService.ts';
import { OptionCard } from '../components/OptionCard.tsx';
import { SectionTitle } from '../components/SectionTitle.tsx';
import { Checkmark } from '../components/Checkmark.tsx';

interface ThemeOption {
  id: ThemePreference;
  label: string;
  description: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
}

export const ThemeSection: React.FC = () => {
  const theme = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);

  const resolved = resolveTheme(theme);

  const handleSelect = (next: ThemePreference) => {
    if (next === theme) return;
    setTheme(next);
    // Persiste no servidor para sincronizar entre dispositivos
    authService.updateTheme(next).then(() => {
      useToastStore.getState().addToast('Tema salvo na conta com sucesso!', 'success');
    }).catch((err) => {
      // O tema continua aplicado localmente, mas avisamos que a sincronização
      // entre dispositivos falhou (ex.: offline).
      useToastStore
        .getState()
        .addToast(
          extractApiError(
            err,
            'Não foi possível salvar o tema na conta. O tema continua aplicado neste dispositivo.',
          ),
          'error',
        );
    });
  };

  const options: ThemeOption[] = [
    {
      id: 'light',
      label: 'Claro',
      description: 'Tema claro padrão',
      icon: <Sun className="h-5 w-5" />,
      iconBg: '#FEF3C7',
      iconColor: '#F59E0B',
    },
    {
      id: 'dark',
      label: 'Escuro',
      description: 'Tema escuro noturno',
      icon: <Moon className="h-5 w-5" />,
      iconBg: '#EDE9FE',
      iconColor: '#818CF8',
    },
    {
      id: 'system',
      label: 'Automático',
      description: 'Segue o tema do dispositivo',
      icon: <Monitor className="h-5 w-5" />,
      iconBg: '#D1FAE5',
      iconColor: '#10B981',
    },
  ];

  return (
    <div
      className="flex flex-col gap-3 p-4 sm:p-5"
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-color)',
        borderRadius: '8px',
      }}
    >
      <SectionTitle
        icon={resolved === 'dark'
          ? <Moon className="h-4 w-4" style={{ color: '#818CF8' }} />
          : resolved === 'light'
            ? <Sun className="h-4 w-4" style={{ color: '#F59E0B' }} />
            : <Monitor className="h-4 w-4" style={{ color: '#10B981' }} />
        }
        label="Tema"
      />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {options.map((option) => (
          <OptionCard
            key={option.id}
            selected={theme === option.id}
            onClick={() => handleSelect(option.id)}
            className="flex items-center gap-3 px-4 py-3.5"
          >
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: option.iconBg, color: option.iconColor }}
            >
              {option.icon}
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-semibold block" style={{ color: 'var(--text-primary)' }}>
                {option.label}
              </span>
              <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                {option.description}
              </p>
            </div>
            <Checkmark visible={theme === option.id} />
          </OptionCard>
        ))}
      </div>
      <p className="text-[10px] mt-1" style={{ color: 'var(--text-secondary)' }}>
        O tema escolhido é salvo na sua conta e sincronizado em todos os dispositivos.
      </p>
    </div>
  );
};
