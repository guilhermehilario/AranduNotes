import { useEffect, useRef, useCallback, type MutableRefObject } from "react";
import { useDebounce } from "../../../hooks/useDebounce";
import { useToastStore } from "../../../store/toastStore";
import { useAuthStore } from "../../../modules/auth/store";
import { useEditorStatusStore } from "../../../store/editorStatusStore";
import { extractApiError } from "../../../utils/api-errors";

const DEBOUNCE_MS = 800;
const SAVE_STATUS_IDLE_MS = 2000;

interface UseEditorSaveParams {
  leafId: string;
  updateLeaf: (data: {
    title: string;
    content: string;
    rawText: string;
  }) => Promise<unknown>;
  localTitle: string;
  localContent: string;
  localRawText: string;
  initialSyncDoneRef: MutableRefObject<boolean>;
  lastSavedRef: MutableRefObject<{ title: string; content: string }>;
  saveInFlightRef: MutableRefObject<boolean>;
  latestValuesRef: MutableRefObject<{
    title: string;
    content: string;
    rawText: string;
  }>;
}

interface UseEditorSaveReturn {
  flushSave: () => Promise<void>;
}

/**
 * Hook responsável por toda a lógica de salvamento do editor:
 * - Salvamento imediato (flushSave)
 * - Salvamento de emergência com keepalive (beforeunload / visibilitychange)
 * - Auto-save com debounce
 * - Eventos de visibilidade da página
 */
export function useEditorSave({
  leafId,
  updateLeaf,
  localTitle,
  localContent,
  localRawText,
  initialSyncDoneRef,
  lastSavedRef,
  saveInFlightRef,
  latestValuesRef,
}: UseEditorSaveParams): UseEditorSaveReturn {
  const leafIdRef = useRef(leafId);

  // Mantém leafIdRef atualizado sem disparar re-renderizações
  // biome-ignore lint/correctness/useExhaustiveDependencies: ref é estável, não precisa de deps
  useEffect(() => {
    leafIdRef.current = leafId;
  }, [leafId]);

  // Refs para acessar as funções de save em effects com deps vazias,
  // evitando que o cleanup do effect dispare em loop
  const flushSaveRef = useRef<(() => Promise<void>) | null>(null);
  const sendKeepaliveSaveRef = useRef<(() => void) | null>(null);

  // ── Salvamento imediato ──

  /** Salva imediatamente sem esperar debounce */
  const flushSave = useCallback(async () => {
    const { title, content, rawText } = latestValuesRef.current;
    if (!initialSyncDoneRef.current) return;

    // Se o título está vazio, usa o último título salvo para não sobrescrever no servidor
    const titleToSave =
      title && title.length > 0 ? title : lastSavedRef.current.title;

    const lastSaved = lastSavedRef.current;
    if (titleToSave === lastSaved.title && content === lastSaved.content)
      return;
    if (saveInFlightRef.current) return;

    saveInFlightRef.current = true;
    useEditorStatusStore.getState().setSaveStatus("saving");

    try {
      await updateLeaf({ title: titleToSave, content, rawText });
      lastSavedRef.current = { title: titleToSave, content };
      useEditorStatusStore.getState().setLastUpdate(new Date().toISOString());
      useEditorStatusStore.getState().setSaveStatus("saved");
    } catch (err) {
      useEditorStatusStore.getState().setSaveStatus("error");
      const errorMessage = extractApiError(
        err,
        "Erro ao salvar. Tente novamente.",
      );
      useToastStore.getState().addToast(errorMessage, "error");
    } finally {
      saveInFlightRef.current = false;
    }
  // biome-ignore lint/correctness/useExhaustiveDependencies: refs são objetos estáveis
  }, [updateLeaf]);

  // ── Salvamento de emergência (keepalive) ──

  /**
   * Envia um salvamento de emergência via fetch com keepalive.
   * Usado como garantia quando o navegador está prestes a suspender a aba
   * (visibilitychange) ou fechar a página (beforeunload).
   * O keepalive diz ao navegador para não abortar a requisição mesmo que
   * a página seja descarregada antes da resposta chegar.
   */
  const sendKeepaliveSave = useCallback(() => {
    const { title, content, rawText } = latestValuesRef.current;
    if (!initialSyncDoneRef.current) return;

    const titleToSave =
      title && title.length > 0 ? title : lastSavedRef.current.title;
    const lastSaved = lastSavedRef.current;
    if (titleToSave === lastSaved.title && content === lastSaved.content)
      return;

    const currentLeafId = leafIdRef.current;
    if (!currentLeafId) return;

    const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
    const accessToken = useAuthStore.getState().accessToken;

    fetch(`${baseUrl}/leaves/${currentLeafId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify({
        title: titleToSave,
        content,
        rawText,
      }),
      keepalive: true,
      credentials: "include",
    }).catch(() => {
      // Silencia erros — é um salvamento best-effort de emergência
    });
  // biome-ignore lint/correctness/useExhaustiveDependencies: refs são objetos estáveis
  }, []);

  // ── Atualização das refs das funções ──

  // biome-ignore lint/correctness/useExhaustiveDependencies: efeito proposital sem deps para evitar cleanup loop
  useEffect(() => {
    flushSaveRef.current = flushSave;
    sendKeepaliveSaveRef.current = sendKeepaliveSave;
  });

  // ── Eventos de visibilidade e fechamento da página ──

  // NOTA: Não colocar flushSave/sendKeepaliveSave nas deps pq elas mudam
  // de referência e fazem o cleanup (que chama flushSave) disparar em loop.
  // Em vez disso, acessamos os valores via refs dentro dos handlers.
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        flushSaveRef.current?.();
        sendKeepaliveSaveRef.current?.();
      }
    };

    const handleBeforeUnload = () => {
      sendKeepaliveSaveRef.current?.();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      // Salva imediatamente ao desmontar o componente (navegação interna)
      // Usa sendKeepaliveSave que já possui keepalive: true no fetch,
      // garantindo que a requisição não seja abortada mesmo se o
      // componente desmontar antes da resposta.
      sendKeepaliveSaveRef.current?.();
    };
  // biome-ignore lint/correctness/useExhaustiveDependencies: efeito proposital sem deps — usa refs para evitar loop de cleanup
  }, []);

  // ── Auto-save com debounce ──

  const debouncedTitle = useDebounce(localTitle, DEBOUNCE_MS);
  const debouncedContent = useDebounce(localContent, DEBOUNCE_MS);
  const debouncedRawText = useDebounce(localRawText, DEBOUNCE_MS);

  // Auto-save com debounce: salva quando o usuário para de digitar
  useEffect(() => {
    if (!initialSyncDoneRef.current) return;

    const lastSaved = lastSavedRef.current;

    // Se o título está vazio, usa o último título salvo para não sobrescrever no servidor
    const titleToSave =
      debouncedTitle && debouncedTitle.length > 0
        ? debouncedTitle
        : lastSaved.title;

    if (
      titleToSave !== lastSaved.title ||
      debouncedContent !== lastSaved.content
    ) {
      if (saveInFlightRef.current) return;

      saveInFlightRef.current = true;
      useEditorStatusStore.getState().setSaveStatus("saving");

      void updateLeaf({
        title: titleToSave,
        content: debouncedContent,
        rawText: debouncedRawText,
      })
        .then(() => {
          lastSavedRef.current = {
            title: titleToSave,
            content: debouncedContent,
          };
          useEditorStatusStore
            .getState()
            .setLastUpdate(new Date().toISOString());
          useEditorStatusStore.getState().setSaveStatus("saved");

          // Volta ao status "idle" após 2s
          setTimeout(() => {
            useEditorStatusStore.getState().setSaveStatus("idle");
          }, SAVE_STATUS_IDLE_MS);
        })
        .catch((err) => {
          useEditorStatusStore.getState().setSaveStatus("error");
          const errorMessage = extractApiError(
            err,
            "Erro ao salvar. Tente novamente.",
          );
          useToastStore.getState().addToast(errorMessage, "error");
        })
        .finally(() => {
          saveInFlightRef.current = false;
        });
    }
  // biome-ignore lint/correctness/useExhaustiveDependencies: refs são objetos estáveis
  }, [debouncedTitle, debouncedContent, debouncedRawText, updateLeaf]);
  // 🔴 editorStatus removido das deps — acessa store diretamente via getState() para evitar loop

  return { flushSave };
}
