import { api } from '../../../core/api/client';
import type { Flashcard } from '../types';

export interface StudySessionData {
  notebookId: string;
  userId?: string;
  currentIndex: number;
  reviewedCount: number;
  showAnswer: boolean;
  sessionActive: boolean;
  flashcards: Flashcard[];
  completedCardIds: string[];
  scores: Record<string, number>;
}

export const studySessionService = {
  /**
   * Salva ou atualiza o estado da sessão de estudo no backend.
   * O usuário autenticado é identificado via cookie/session no servidor.
   */
  async saveSession(
    notebookId: string,
    data: Omit<StudySessionData, 'notebookId'>,
  ): Promise<StudySessionData> {
    const response = await api.put<StudySessionData>(
      `/study-sessions/${notebookId}`,
      data,
    );
    return response.data;
  },

  /**
   * Carrega a sessão de estudo salva para um caderno específico.
   * Retorna null se não houver sessão salva.
   */
  async loadSession(notebookId: string): Promise<StudySessionData | null> {
    try {
      // validateStatus aceita 404 como resposta válida (evita console noise)
      const response = await api.get<StudySessionData>(
        `/study-sessions/${notebookId}`,
        { validateStatus: (status) => status < 500 },
      );
      if (response.status === 404) return null;
      return response.data;
    } catch {
      return null;
    }
  },

  /**
   * Remove a sessão de estudo do backend (ao finalizar ou resetar).
   */
  async deleteSession(notebookId: string): Promise<void> {
    await api.delete(`/study-sessions/${notebookId}`);
  },
};

export default studySessionService;
