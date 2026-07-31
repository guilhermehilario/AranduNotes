import React from 'react';
import { Calendar, Clock } from 'lucide-react';
import { useUIStore } from '../../../store/uiStore.ts';
import { OptionCard } from '../components/OptionCard.tsx';
import { SectionTitle } from '../components/SectionTitle.tsx';
import { Checkmark } from '../components/Checkmark.tsx';

export const DateTimeSection: React.FC = () => {
  const { dateFormat, timeFormat, setDateFormat, setTimeFormat } = useUIStore();

  const dateFormats = [
    { value: 'dd/MM/yyyy', label: '31/12/2024', desc: 'Dia/Mês/Ano' },
    { value: 'MM/dd/yyyy', label: '12/31/2024', desc: 'Mês/Dia/Ano' },
    { value: 'yyyy-MM-dd', label: '2024-12-31', desc: 'Ano-Mês-Dia' },
  ];

  return (
    <>
      {/* Formato de Data */}
      <div
        className="flex flex-col gap-3 p-4 sm:p-5"
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {dateFormats.map((fmt) => (
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

      {/* Formato de Hora */}
      <div
        className="flex flex-col gap-3 p-4 sm:p-5"
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
    </>
  );
};
