import { useState, useEffect, useRef, useCallback } from 'react';

interface UseDropdownOptions {
  /** Fecha o dropdown ao scrollar a página? Padrão: true */
  scrollClose?: boolean;
}

interface UseDropdownReturn {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  close: () => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
  buttonRef: React.RefObject<HTMLButtonElement | null>;
  dropdownStyle: React.CSSProperties;
  recalcPosition: () => void;
}

export function useDropdown(options?: UseDropdownOptions): UseDropdownReturn {
  const [open, setOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => setOpen(false), []);

  const recalcPosition = useCallback(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownStyle({
        top: rect.bottom + 4,
        left: Math.max(8, rect.left),
      });
    }
  }, []);

  // Fecha ao clicar fora
  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  // Fecha ao scrollar (fase de captura)
  useEffect(() => {
    if (!open || options?.scrollClose === false) return;
    const onScroll = () => setOpen(false);
    document.addEventListener('scroll', onScroll, true);
    return () => document.removeEventListener('scroll', onScroll, true);
  }, [open, options?.scrollClose]);

  return { open, setOpen, close, containerRef, buttonRef, dropdownStyle, recalcPosition };
}
