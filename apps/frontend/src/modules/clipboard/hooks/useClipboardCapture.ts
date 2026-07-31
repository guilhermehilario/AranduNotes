import { useEffect } from 'react';
import { useClipboardStore } from '../../../store/clipboardStore.ts';

/**
 * Hook that listens for copy/cut events globally and captures
 * the copied/cut text into the clipboard history store.
 *
 * Also listens for Ctrl+Shift+V / Cmd+Shift+V to toggle the clipboard panel.
 *
 * Nota (mobile): a leitura é feita direto do `clipboardData` do evento (e não
 * via `window.getSelection()` com setTimeout), porque no navegador mobile a
 * seleção DOM pode não estar disponível — ou já ter sido limpa — quando o
 * usuário usa a ação nativa de copiar do menu de contexto.
 */
export function useClipboardCapture() {
  const addItem = useClipboardStore((s) => s.addItem);
  const toggleOpen = useClipboardStore((s) => s.toggleOpen);

  useEffect(() => {
    const capture = (e: ClipboardEvent) => {
      // Fonte autoritativa: o texto que está sendo copiado, direto do evento.
      // Funciona no mobile, onde `window.getSelection()` costuma voltar vazio.
      const fromEvent = e.clipboardData?.getData('text/plain')?.trim();
      // Fallback para browsers em que o clipboardData do evento vem vazio.
      const selection = window.getSelection();
      const fromSelection = selection?.toString().trim();
      const text = fromEvent || fromSelection;
      if (text) {
        addItem(text);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Shift+V or Cmd+Shift+V to toggle clipboard panel
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'V') {
        e.preventDefault();
        toggleOpen();
      }
    };

    document.addEventListener('copy', capture);
    document.addEventListener('cut', capture);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('copy', capture);
      document.removeEventListener('cut', capture);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [addItem, toggleOpen]);
}
