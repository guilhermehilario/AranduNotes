/** Cores pré-definidas para tags */
export const TAG_COLORS_ARRAY = [
  '#ef4444',
  '#f59e0b',
  '#aa3bff',
  '#10b981',
  '#3b82f6',
  '#ec4899',
  '#6b7280',
  '#14b8a6',
] as const;

/** Mapa nome → cor para tags padrão */
export const TAG_COLOR_MAP: Record<string, string> = {
  Importante: '#ef4444',
  Prova: '#f59e0b',
  ProvaFinal: '#aa3bff',
  Exercicios: '#10b981',
  Revisao: '#3b82f6',
  Professor: '#ec4899',
};

/** Tags padrão criadas no seed do backend */
export const DEFAULT_TAGS = [
  { name: 'Importante', color: '#ef4444' },
  { name: 'Prova', color: '#f59e0b' },
  { name: 'ProvaFinal', color: '#aa3bff' },
  { name: 'Exercicios', color: '#10b981' },
  { name: 'Revisao', color: '#3b82f6' },
  { name: 'Professor', color: '#ec4899' },
] as const;

/** Cor padrão para novas tags */
export const DEFAULT_TAG_COLOR = '#aa3bff';

/** Obtém a cor de uma tag, com fallback */
export function getTagColor(color?: string | null, name?: string): string {
  return color || (name && TAG_COLOR_MAP[name]) || DEFAULT_TAG_COLOR;
}
