import { useUIStore } from '../store/uiStore.ts';

export type DateFormat = 'dd/MM/yyyy' | 'MM/dd/yyyy' | 'yyyy-MM-dd';

const SEGMENTS: Record<DateFormat, Intl.DateTimeFormatOptions> = {
  'dd/MM/yyyy': { day: '2-digit', month: '2-digit', year: 'numeric' },
  'MM/dd/yyyy': { month: '2-digit', day: '2-digit', year: 'numeric' },
  'yyyy-MM-dd': { year: 'numeric', month: '2-digit', day: '2-digit' },
};

/** Converte o formato de data do usuário (templates dd/MM/yyyy) -> Intl options. */
function toIntlOptions(format: string): Intl.DateTimeFormatOptions {
  return SEGMENTS[(format as DateFormat) in SEGMENTS ? (format as DateFormat) : 'dd/MM/yyyy']
    ?? SEGMENTS['dd/MM/yyyy'];
}

/** Formata uma data (Date, ISO string ou número timestamp) no idioma/forma do usuário. */
export function formatDate(
  value: string | Date | number | null | undefined,
): string {
  if (value == null || value === '') return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const { dateFormat } = useUIStore.getState();
  return date.toLocaleDateString('pt-BR', toIntlOptions(dateFormat));
}

/**
 * Formata uma data por extenso (dia da semana + dia + mês), no idioma do usuário.
 * Usado em cabeçalhos de calendário/agenda/histórico.
 */
export function formatDateLong(
  value: string | Date | number | null | undefined,
): string {
  if (value == null || value === '') return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

/** Formata uma data curta com dia da semana abreviado (ex: "seg, 1 de jan"). */
export function formatDateShort(
  value: string | Date | number | null | undefined,
): string {
  if (value == null || value === '') return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

/** Formata uma hora respeitando a preferência 24h/12h do usuário. */
export function formatTime(
  value: string | Date | number | null | undefined,
): string {
  if (value == null || value === '') return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return formatClockTime(date);
}

/**
 * Formata uma string de relógio "HH:mm" (ou "HH:mm:ss") respeitando a
 * preferência 24h/12h do usuário. Ex: "14:30" -> "14:30" (24h) ou "2:30 PM" (12h).
 */
export function formatClockTime(
  value: string | Date | null | undefined,
): string {
  if (value == null || value === '') return '';
  const { timeFormat } = useUIStore.getState();

  const m = typeof value === 'string'
    ? value.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?/)
    : null;

  const now = new Date();
  const d = m
    ? new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        Number(m[1]),
        Number(m[2]),
        m[3] ? Number(m[3]) : 0,
      )
    : new Date(value);

  if (Number.isNaN(d.getTime())) return typeof value === 'string' ? value : '';

  return d.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: timeFormat === '12h',
  });
}

/** Formata data + hora respeitando as preferências do usuário. */
export function formatDateTime(
  value: string | Date | number | null | undefined,
): string {
  if (value == null || value === '') return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const { dateFormat, timeFormat } = useUIStore.getState();
  const locale = 'pt-BR';
  return `${date.toLocaleDateString(locale, toIntlOptions(dateFormat))} ${date.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: timeFormat === '12h',
  })}`;
}

/** Tempo relativo ("agora", "5min", "2 horas", "3 dias") em pt-BR. */
export function formatTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 10) return 'agora';
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes === 1) return '1 min';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours === 1) return '1 hora';
  if (hours < 24) return `${hours} horas`;
  const days = Math.floor(hours / 24);
  if (days === 1) return '1 dia';
  return `${days} dias`;
}

/** "Hoje" / "Ontem" ou data por extenso, comparando por data local. */
export function formatRelativeDay(
  value: string | Date | null | undefined,
): string {
  if (value == null || value === '') return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return 'Hoje';
  if (date.toDateString() === yesterday.toDateString()) return 'Ontem';
  return formatDateLong(date);
}
