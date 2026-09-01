import { api } from '../../../core/api/client';
import type { Question, CreateQuestionInput, QuestionFilters } from '../types';

export const questionService = {
  async getAll(filters?: QuestionFilters): Promise<Question[]> {
    const params: Record<string, string> = {};
    if (filters?.notebookId) params.notebookId = filters.notebookId;
    if (filters?.theme) params.theme = filters.theme;
    if (filters?.questionType) params.questionType = filters.questionType;
    const response = await api.get<Question[]>('/questions', { params });
    return response.data;
  },

  async getRandom(limit: number = 10, notebookId?: string): Promise<Question[]> {
    const params: Record<string, string> = { limit: String(limit) };
    if (notebookId) params.notebookId = notebookId;
    const response = await api.get<Question[]>('/questions/random', { params });
    return response.data;
  },

  async getOne(id: string): Promise<Question> {
    const response = await api.get<Question>(`/questions/${id}`);
    return response.data;
  },

  async create(data: CreateQuestionInput): Promise<Question> {
    const response = await api.post<Question>('/questions', data);
    return response.data;
  },

  async generateFromFlashcard(flashcardId: string): Promise<Question> {
    const response = await api.post<Question>(`/questions/from-flashcard/${flashcardId}`);
    return response.data;
  },

  async update(id: string, data: Partial<CreateQuestionInput>): Promise<Question> {
    const response = await api.put<Question>(`/questions/${id}`, data);
    return response.data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/questions/${id}`);
  },
};

export default questionService;
