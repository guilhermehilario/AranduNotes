import React, { useState, useRef, useCallback, useEffect } from "react";
import type { UsePlanningFlyoutReturn } from "../sidebar.types";

/**
 * usePlanningFlyout — Gerencia estado, posicionamento e eventos do flyout
 * do Planejamento no modo colapsado da sidebar.
 *
 * Responsabilidades:
 * - Estado de abertura (clique + hover)
 * - Posicionamento via getBoundingClientRect
 * - Timeout de transição hover → flyout
 * - Fechamento ao clicar fora
 */
export function usePlanningFlyout(): UsePlanningFlyoutReturn {
  const [planningFlyoutOpen, setPlanningFlyoutOpen] = useState(false);
  const [flyoutHover, setFlyoutHover] = useState(false);
  const planningBtnRef = useRef<HTMLButtonElement>(null);
  const flyoutRef = useRef<HTMLDivElement>(null);
  const [flyoutStyle, setFlyoutStyle] = useState<React.CSSProperties>({});
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showFlyout = planningFlyoutOpen || flyoutHover;

  // Atualiza a posição do flyout baseado no botão
  const updateFlyoutPosition = useCallback(() => {
    if (planningBtnRef.current) {
      const rect = planningBtnRef.current.getBoundingClientRect();
      setFlyoutStyle({
        top: rect.top + 140,
        left: rect.right + 80,
      });
    }
  }, []);

  // Timeout para permitir que o mouse alcance o flyout antes de escondê-lo
  const handlePlanningMouseLeave = useCallback(() => {
    hideTimeoutRef.current = setTimeout(() => {
      if (!planningFlyoutOpen) setFlyoutHover(false);
    }, 180);
  }, [planningFlyoutOpen]);

  const handleFlyoutMouseEnter = useCallback(() => {
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    setFlyoutHover(true);
  }, []);

  // Limpa timeout ao desmontar
  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, []);

  // Fecha o flyout ao clicar fora
  useEffect(() => {
    if (!showFlyout) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        planningBtnRef.current &&
        !planningBtnRef.current.contains(e.target as Node) &&
        flyoutRef.current &&
        !flyoutRef.current.contains(e.target as Node)
      ) {
        if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
        setPlanningFlyoutOpen(false);
        setFlyoutHover(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showFlyout]);

  return {
    planningFlyoutOpen,
    setPlanningFlyoutOpen,
    flyoutHover,
    setFlyoutHover,
    planningBtnRef,
    flyoutRef,
    flyoutStyle,
    showFlyout,
    updateFlyoutPosition,
    handlePlanningMouseLeave,
    handleFlyoutMouseEnter,
  };
}
