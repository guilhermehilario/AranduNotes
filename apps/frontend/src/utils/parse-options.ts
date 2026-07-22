/**
 * Converte uma string JSON de opções em um array de strings.
 * Usado por componentes de questões e simulados.
 */
export function safeParseOptions(optionsStr: string): string[] {
  try {
    const parsed = JSON.parse(optionsStr);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
