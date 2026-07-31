import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useUIStore } from '../../../store/uiStore.ts';
import { OptionCard } from '../components/OptionCard.tsx';
import { SectionTitle } from '../components/SectionTitle.tsx';
import { Checkmark } from '../components/Checkmark.tsx';

export const ThemeSection: React.FC = () => {
  const { theme, toggleTheme } = useUIStore();

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
        icon={theme === 'dark'
          ? <Moon className="h-4 w-4" style={{ color: '#818CF8' }} />
          : <Sun className="h-4 w-4" style={{ color: '#F59E0B' }} />
        }
        label="Tema"
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
  );
};
