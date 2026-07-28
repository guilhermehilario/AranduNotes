import { useEffect } from 'react';
import { useClipboardStore } from '../../../store/clipboardStore.ts';

/**
 * Hook that listens for copy/cut events globally and captures
 * the selected text into the clipboard history store.
 *
 * Also listens for Ctrl+Shift+V / Cmd+Shift+V to toggle the clipboard panel.
 */
export function useClipboardCapture() {
  const addItem = useClipboardStore((s) => s.addItem);
  const toggleOpen = useClipboardStore((s) => s.toggleOpen);

  useEffect(() => {
    const handleCopy = (_e: ClipboardEvent) => {
      // Give the browser time to write to the clipboard, then capture
      setTimeout(() => {
        const selection = window.getSelection();
        const text = selection?.toString().trim();
        if (text) {
          addItem(text);
        }
      }, 0);
    };

    const handleCut = (_e: ClipboardEvent) => {
      setTimeout(() => {
        const selection = window.getSelection();
        const text = selection?.toString().trim();
        if (text) {
          addItem(text);
        }
      }, 0);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Shift+V or Cmd+Shift+V to toggle clipboard panel
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'V') {
        e.preventDefault();
        toggleOpen();
      }
    };

    document.addEventListener('copy', handleCopy);
    document.addEventListener('cut', handleCut);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('cut', handleCut);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [addItem, toggleOpen]);
}
