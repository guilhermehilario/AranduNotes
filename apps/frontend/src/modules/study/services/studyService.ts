import { api } from '../../../core/api/client';
import type { Flashcard, StudyScore, StudyContent } from '../types';

export const studyService = {
  // ── Flashcards ──

  async getLeafFlashcards(leafId: string): Promise<Flashcard[]> {
    const response = await api.get<Flashcard[]>(`/leaves/${leafId}/flashcards`);
    return response.data;
  },

  async getNotebookFlashcards(notebookId: string): Promise<Flashcard[]> {
    const response = await api.get<Flashcard[]>(`/notebooks/${notebookId}/flashcards`);
    return response.data;
  },

  async submitFlashcardScore(
    cardId: string,
    score: StudyScore
  ): Promise<Flashcard> {
    const response = await api.post<Flashcard>(`/flashcards/${cardId}/review`, { score });
    return response.data;
  },

  async createFlashcard(data: {
    leafId: string;
    notebookId: string;
    front: string;
    back: string;
  }): Promise<Flashcard> {
    const response = await api.post<Flashcard>('/flashcards', data);
    return response.data;
  },

  async updateFlashcard(
    cardId: string,
    data: { front?: string; back?: string }
  ): Promise<Flashcard> {
    const response = await api.put<Flashcard>(`/flashcards/${cardId}`, data);
    return response.data;
  },

  // ── Dashboard / conteúdo de estudo (unificado de studiesService) ──

  async getContent(notebookId?: string): Promise<StudyContent> {
    const params = notebookId ? { notebookId } : {};
    const response = await api.get<StudyContent>('/studies/content', { params });
    return response.data;
  },

  async getDashboardStats(): Promise<{
    totalFlashcards: number;
    flashcardsDue: number;
    totalQuestions: number;
    totalMockExams: number;
  }> {
    const response = await api.get<{
      totalFlashcards: number;
      flashcardsDue: number;
      totalQuestions: number;
      totalMockExams: number;
    }>('/studies/stats');
    return response.data;
  },

  // ── Estatísticas de progresso (sessão de estudo SM-2) ──

  async getStats(): Promise<StudyStats> {
    const response = await api.get<StudyStats>('/study/stats');
    return response.data;
  },
};

// ── Tipos para estatísticas de estudo ──
export interface StudyStats {
  totalCards: number;
  reviewedToday: number;
  dueForReview: number;
  accuracyRate: number;
  avgEaseFactor: number;
  perNotebook: Array<{
    notebookId: string;
    notebookTitle: string;
    notebookColor: string;
    totalCards: number;
    reviewedToday: number;
    dueForReview: number;
  }>;
}

export default studyService;
