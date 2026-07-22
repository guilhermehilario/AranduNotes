import { create } from 'zustand';
import type { Flashcard } from './types';

/*
 * 🧠 studyStore – Isolamento de Estado da Sessão de Estudos
 *
 * Gerencia o estado da sessão ATUAL indexada por `notebookId`.
 * Como a store vive FORA do ciclo de vida dos componentes React,
 * mesmo que o ecossistema (React Query, React Router) dispare
 * re-renderizações em cascata nos componentes pai, o progresso
 * do usuário (currentIndex, reviewedCount, showAnswer) permanece
 * intacto, eliminando o reset do card para o índice 0.
 *
 * ⚡ AGORA TAMBÉM SALVA OS FLASHCARDS DA SESSÃO na store,
 * garantindo que, mesmo se o componente StudyView for remontado,
 * os cards congelados permaneçam intactos — sem mostrar "Sessão
 * concluída" indevidamente enquanto os dados recarregam.
 *
 * O acoplamento por notebookId garante que, ao navegar para o
 * estudo de outro caderno, o estado não vaze entre sessões.
 */

interface StudySession {
  currentIndex: number;
  reviewedCount: number;
  showAnswer: boolean;
  sessionActive: boolean;
  /** Flashcards congelados da sessão — persiste mesmo com remount */
  flashcards: Flashcard[];
  /** IDs dos cards que já foram respondidos nesta sessão */
  completedCardIds: string[];
  /** Mapa de scores submetidos para cada card */
  scores: Record<string, number>;
}

interface StudySessionState {
  sessions: Record<string, StudySession>;
}

interface StudySessionActions {
  setCurrentIndex: (notebookId: string, index: number) => void;
  setReviewedCount: (notebookId: string, count: number) => void;
  setShowAnswer: (notebookId: string, show: boolean) => void;
  setSessionActive: (notebookId: string, active: boolean) => void;
  /** Congela os flashcards da sessão — chamado uma vez no início */
  setSessionFlashcards: (notebookId: string, cards: Flashcard[]) => void;
  /** Marca um card como respondido e registra o score */
  markCardCompleted: (notebookId: string, cardId: string, score: number) => void;
  /** Restaura uma sessão completa a partir de dados do backend */
  loadSession: (notebookId: string, data: {
    currentIndex: number;
    reviewedCount: number;
    showAnswer: boolean;
    sessionActive: boolean;
    flashcards: Flashcard[];
    completedCardIds: string[];
    scores: Record<string, number>;
  }) => void;
  /** Reseta APENAS a sessão do notebook informado */
  resetSession: (notebookId: string) => void;
}

const defaultSession = (): StudySession => ({
  currentIndex: 0,
  reviewedCount: 0,
  showAnswer: false,
  sessionActive: false,
  flashcards: [],
  completedCardIds: [],
  scores: {},
});

export const useStudyStore = create<StudySessionState & StudySessionActions>()(
  (set) => ({
    sessions: {},

    setCurrentIndex: (notebookId, index) =>
      set((state) => ({
        sessions: {
          ...state.sessions,
          [notebookId]: {
            ...state.sessions[notebookId] ?? defaultSession(),
            currentIndex: index,
          },
        },
      })),

    setReviewedCount: (notebookId, count) =>
      set((state) => ({
        sessions: {
          ...state.sessions,
          [notebookId]: {
            ...state.sessions[notebookId] ?? defaultSession(),
            reviewedCount: count,
          },
        },
      })),

    setShowAnswer: (notebookId, show) =>
      set((state) => ({
        sessions: {
          ...state.sessions,
          [notebookId]: {
            ...state.sessions[notebookId] ?? defaultSession(),
            showAnswer: show,
          },
        },
      })),

    setSessionActive: (notebookId, active) =>
      set((state) => ({
        sessions: {
          ...state.sessions,
          [notebookId]: {
            ...state.sessions[notebookId] ?? defaultSession(),
            sessionActive: active,
          },
        },
      })),

    setSessionFlashcards: (notebookId, cards) =>
      set((state) => {
        const existing = state.sessions[notebookId];
        // Se já existem flashcards na sessão, não sobrescreve
        if (existing && existing.flashcards.length > 0) return state;
        return {
          sessions: {
            ...state.sessions,
            [notebookId]: {
              ...existing ?? defaultSession(),
              flashcards: cards,
              sessionActive: true,
            },
          },
        };
      }),

    markCardCompleted: (notebookId, cardId, score) =>
      set((state) => {
        const session = state.sessions[notebookId] ?? defaultSession();
        // Evita duplicatas
        if (session.completedCardIds.includes(cardId)) return state;
        return {
          sessions: {
            ...state.sessions,
            [notebookId]: {
              ...session,
              completedCardIds: [...session.completedCardIds, cardId],
              scores: { ...session.scores, [cardId]: score },
            },
          },
        };
      }),

    loadSession: (notebookId, data) =>
      set((state) => ({
        sessions: {
          ...state.sessions,
          [notebookId]: {
            currentIndex: data.currentIndex,
            reviewedCount: data.reviewedCount,
            showAnswer: data.showAnswer,
            sessionActive: data.sessionActive,
            flashcards: data.flashcards,
            completedCardIds: data.completedCardIds,
            scores: data.scores,
          },
        },
      })),

    resetSession: (notebookId) =>
      set((state) => ({
        sessions: {
          ...state.sessions,
          [notebookId]: defaultSession(),
        },
      })),
  }),
);
