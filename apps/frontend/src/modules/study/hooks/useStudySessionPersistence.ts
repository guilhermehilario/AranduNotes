import { useEffect, useRef, useCallback, startTransition } from 'react';
import { useStudyStore } from '../studyStore';
import studySessionService from '../services/studySessionService';

/**
 * 🧠 useStudySessionPersistence
 *
 * Sincroniza automaticamente o estado da sessão de estudo (studyStore)
 * com o backend (arquivo db.json via API) sempre que o progresso do
 * usuário mudar (currentIndex, reviewedCount, scores, etc.).
 *
 * O salvamento é debounced (2 segundos após a última mudança) e nunca
 * bloqueia a UI. Ao montar o componente, tenta restaurar a sessão
 * salva do backend — se existir, o usuário continua de onde parou.
 *
 * Uso: colocar dentro do StudyView e passar o notebookId.
 */
export function useStudySessionPersistence(notebookId: string) {
  const sessionSlot = useStudyStore((s) => s.sessions[notebookId]);
  const loadSession = useStudyStore((s) => s.loadSession);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const restoreAttemptedRef = useRef(false);
  const isRestoringRef = useRef(false);

  // ── 1. Restaura sessão salva no backend ao montar ──
  useEffect(() => {
    if (!notebookId || restoreAttemptedRef.current || isRestoringRef.current) return;

    isRestoringRef.current = true;
    restoreAttemptedRef.current = true;

    studySessionService
      .loadSession(notebookId)
      .then((savedSession) => {
        if (!savedSession || !savedSession.sessionActive) return;

        // Só restaura se os flashcards salvos baterem com o que já está na store
        // (evita sobrescrever uma sessão mais recente que o usuário iniciou)
        const currentFlashcards = sessionSlot?.flashcards ?? [];

        if (currentFlashcards.length > 0) {
          // Já tem sessão ativa na store, não sobrescreve
          return;
        }

        startTransition(() => {
          loadSession(notebookId, {
            currentIndex: savedSession.currentIndex,
            reviewedCount: savedSession.reviewedCount,
            showAnswer: savedSession.showAnswer,
            sessionActive: savedSession.sessionActive,
            flashcards: savedSession.flashcards,
            completedCardIds: savedSession.completedCardIds,
            scores: savedSession.scores,
          });
          // ⚡ Reseta a flag de restauração DENTRO do startTransition,
          //     garantindo que o estado da store já foi aplicado antes
          //     de permitir que o efeito de persistência dispare.
          isRestoringRef.current = false;
        });
      })
      .catch(() => {
        isRestoringRef.current = false;
        // Falha silenciosa — apenas não restaura
      });
  }, [notebookId, sessionSlot?.flashcards?.length, loadSession]);

  // ── 2. Persiste sessão no backend com debounce ──
  const persistSession = useCallback(() => {
    if (!notebookId || !sessionSlot) return;
    // Não persiste se a sessão não foi ativada ainda
    if (!sessionSlot.sessionActive && sessionSlot.flashcards.length === 0) return;

    const data = {
      currentIndex: sessionSlot.currentIndex,
      reviewedCount: sessionSlot.reviewedCount,
      showAnswer: sessionSlot.showAnswer,
      sessionActive: sessionSlot.sessionActive,
      flashcards: sessionSlot.flashcards,
      completedCardIds: sessionSlot.completedCardIds,
      scores: sessionSlot.scores,
    };

    studySessionService.saveSession(notebookId, data).catch(() => {
      // Falha silenciosa — o próximo save tentará novamente
    });
  }, [notebookId, sessionSlot]);

  // Dispara persistência debounced sempre que o estado da sessão mudar
  useEffect(() => {
    if (!sessionSlot || !notebookId) return;
    // Não persiste enquanto está restaurando
    if (isRestoringRef.current) return;

    if (debounceRef.current !== null) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      persistSession();
    }, 2000); // 2s de debounce

    return () => {
      if (debounceRef.current !== null) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [
    notebookId,
    sessionSlot?.currentIndex,
    sessionSlot?.reviewedCount,
    sessionSlot?.showAnswer,
    sessionSlot?.sessionActive,
    sessionSlot?.flashcards?.length,
    sessionSlot?.completedCardIds?.length,
    persistSession,
  ]);

  /**
   * Limpa a sessão persistida no backend (chamar ao resetar/finalizar).
   */
  const clearPersistedSession = useCallback(async () => {
    if (!notebookId) return;
    try {
      await studySessionService.deleteSession(notebookId);
    } catch {
      // Falha silenciosa
    }
  }, [notebookId]);

  return { clearPersistedSession };
}

export default useStudySessionPersistence;
