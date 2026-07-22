import React from 'react';
import {
  Moon,
  Sun,
  Globe,
  Calendar,
  Clock,
  Check,
} from 'lucide-react';
import { useUIStore } from '../../store/uiStore';

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

  return (
    <div className="flex flex-col gap-8 max-h-[calc(90vh-12rem)] overflow-y-auto pr-1">
      {/* Tema */}
      <div className="flex flex-col gap-3">
        <label className="text-sm font-bold text-slate-700 dark:text-dark-200 flex items-center gap-2">
          {theme === 'dark' ? <Moon className="h-4 w-4 text-indigo-500" /> : <Sun className="h-4 w-4 text-amber-500" />} Tema
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => { if (theme !== 'light') toggleTheme(); }}
            className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 transition-all cursor-pointer ${
              theme === 'light'
                ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/20'
                : 'border-slate-200 dark:border-dark-700 hover:border-slate-300 dark:hover:border-dark-600'
            }`}
          >
            <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-950/20 flex items-center justify-center">
              <Sun className="h-5 w-5 text-amber-500" />
            </div>
            <div className="flex-1">
              <span className="text-sm font-semibold text-slate-700 dark:text-dark-200">Claro</span>
              <p className="text-[10px] text-slate-400 dark:text-dark-500">Tema claro padrão</p>
            </div>
            {theme === 'light' && <Check className="h-4 w-4 text-brand-500" />}
          </button>

          <button
            type="button"
            onClick={() => { if (theme !== 'dark') toggleTheme(); }}
            className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 transition-all cursor-pointer ${
              theme === 'dark'
                ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/20'
                : 'border-slate-200 dark:border-dark-700 hover:border-slate-300 dark:hover:border-dark-600'
            }`}
          >
            <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/20 flex items-center justify-center">
              <Moon className="h-5 w-5 text-indigo-500" />
            </div>
            <div className="flex-1">
              <span className="text-sm font-semibold text-slate-700 dark:text-dark-200">Escuro</span>
              <p className="text-[10px] text-slate-400 dark:text-dark-500">Tema escuro noturno</p>
            </div>
            {theme === 'dark' && <Check className="h-4 w-4 text-brand-500" />}
          </button>
        </div>
      </div>

      {/* Idioma */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-bold text-slate-700 dark:text-dark-200 flex items-center gap-2">
          <Globe className="h-4 w-4 text-sky-500" /> Idioma
        </label>
        <div className="relative">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full px-3.5 py-3 bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700 rounded-xl text-slate-900 dark:text-dark-50 focus:outline-none focus:ring-4 focus:ring-brand-100 dark:focus:ring-brand-900/20 focus:border-brand-500 transition-all duration-200 cursor-pointer appearance-none"
          >
            <option value="pt-BR">🇧🇷 Português (Brasil)</option>
            <option value="en-US">🇺🇸 English (US)</option>
            <option value="es">🇪🇸 Español</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5">
            <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Formato de Data */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-bold text-slate-700 dark:text-dark-200 flex items-center gap-2">
          <Calendar className="h-4 w-4 text-emerald-500" /> Formato de Data
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { value: 'dd/MM/yyyy', label: '31/12/2024', desc: 'Dia/Mês/Ano' },
            { value: 'MM/dd/yyyy', label: '12/31/2024', desc: 'Mês/Dia/Ano' },
            { value: 'yyyy-MM-dd', label: '2024-12-31', desc: 'Ano-Mês-Dia' },
          ].map((fmt) => (
            <button
              key={fmt.value}
              type="button"
              onClick={() => setDateFormat(fmt.value)}
              className={`flex flex-col items-center gap-1 px-3 py-3 rounded-xl border-2 transition-all cursor-pointer ${
                dateFormat === fmt.value
                  ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/20'
                  : 'border-slate-200 dark:border-dark-700 hover:border-slate-300 dark:hover:border-dark-600'
              }`}
            >
              <span className="text-sm font-semibold text-slate-700 dark:text-dark-200">{fmt.label}</span>
              <span className="text-[10px] text-slate-400 dark:text-dark-500">{fmt.desc}</span>
              {dateFormat === fmt.value && <Check className="h-3.5 w-3.5 text-brand-500 mt-1" />}
            </button>
          ))}
        </div>
      </div>

      {/* Formato de Hora */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-bold text-slate-700 dark:text-dark-200 flex items-center gap-2">
          <Clock className="h-4 w-4 text-amber-500" /> Formato de Hora
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setTimeFormat('24h')}
            className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 transition-all cursor-pointer ${
              timeFormat === '24h' ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/20' : 'border-slate-200 dark:border-dark-700 hover:border-slate-300'
            }`}
          >
            <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-dark-800 flex items-center justify-center">
              <span className="text-sm font-extrabold text-slate-600 dark:text-dark-200">24</span>
            </div>
            <div className="flex-1">
              <span className="text-sm font-semibold text-slate-700 dark:text-dark-200">24 horas</span>
              <p className="text-[10px] text-slate-400 dark:text-dark-500">14:30</p>
            </div>
            {timeFormat === '24h' && <Check className="h-4 w-4 text-brand-500" />}
          </button>
          <button
            type="button"
            onClick={() => setTimeFormat('12h')}
            className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 transition-all cursor-pointer ${
              timeFormat === '12h' ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/20' : 'border-slate-200 dark:border-dark-700 hover:border-slate-300'
            }`}
          >
            <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-dark-800 flex items-center justify-center">
              <span className="text-sm font-extrabold text-slate-600 dark:text-dark-200">12</span>
            </div>
            <div className="flex-1">
              <span className="text-sm font-semibold text-slate-700 dark:text-dark-200">12 horas</span>
              <p className="text-[10px] text-slate-400 dark:text-dark-500">2:30 PM</p>
            </div>
            {timeFormat === '12h' && <Check className="h-4 w-4 text-brand-500" />}
          </button>
        </div>
      </div>
      <div className="pb-2" /> {/* spacer */}
    </div>
  );
};

export default SettingsTab;
