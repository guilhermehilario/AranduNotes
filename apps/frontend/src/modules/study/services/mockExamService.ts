import { api } from '../../../core/api/client';
import type {
  MockExam,
  MockExamAttempt,
  CreateMockExamInput,
  CreateExamFromQuestionsInput,
} from '../types';

export const mockExamService = {
  async getAll(notebookId?: string): Promise<MockExam[]> {
    const params = notebookId ? { notebookId } : {};
    const response = await api.get<MockExam[]>('/mock-exams', { params });
    return response.data;
  },

  async getOne(id: string): Promise<MockExam> {
    const response = await api.get<MockExam>(`/mock-exams/${id}`);
    return response.data;
  },

  async create(data: CreateMockExamInput): Promise<MockExam> {
    const response = await api.post<MockExam>('/mock-exams', data);
    return response.data;
  },

  async createFromQuestions(data: CreateExamFromQuestionsInput): Promise<MockExam> {
    const response = await api.post<MockExam>('/mock-exams/from-questions', data);
    return response.data;
  },

  async generateFromNotebook(notebookId: string, title?: string): Promise<MockExam> {
    const params = title ? { title } : {};
    const response = await api.post<MockExam>(`/mock-exams/generate/${notebookId}`, null, { params });
    return response.data;
  },

  async submitAttempt(examId: string, data: { answers: Record<string, string>; selfGrades: Record<string, boolean> }): Promise<MockExamAttempt> {
    const response = await api.post<MockExamAttempt>(`/mock-exams/${examId}/submit`, data);
    return response.data;
  },

  async getAttempts(examId: string): Promise<MockExamAttempt[]> {
    const response = await api.get<MockExamAttempt[]>(`/mock-exams/${examId}/attempts`);
    return response.data;
  },

  async addQuestion(examId: string, questionId: string): Promise<void> {
    await api.post(`/mock-exams/${examId}/questions`, { questionId });
  },

  async removeQuestion(examId: string, questionId: string): Promise<void> {
    await api.delete(`/mock-exams/${examId}/questions/${questionId}`);
  },

  async remove(examId: string): Promise<void> {
    await api.delete(`/mock-exams/${examId}`);
  },
};

export default mockExamService;
