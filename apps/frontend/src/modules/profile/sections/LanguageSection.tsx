import React from 'react';
import { Globe } from 'lucide-react';
import { useUIStore } from '../../../store/uiStore.ts';
import { SectionTitle } from '../components/SectionTitle.tsx';

export const LanguageSection: React.FC = () => {
  const { language, setLanguage } = useUIStore();

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
  );
};
