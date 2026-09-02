import { z } from 'zod';

export const SHAREABLE_RESOURCE_TYPES = [
  'notebook',
  'leaf',
  'question',
  'flashcard',
  'mockExam',
] as const;

export type ShareResourceType = (typeof SHAREABLE_RESOURCE_TYPES)[number];

export const ResourceUserSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
});
export type ResourceUser = z.infer<typeof ResourceUserSchema>;

export const ShareScopeItemSchema = z.object({
  id: z.string().uuid(),
  leafId: z.string().uuid(),
});
export type ShareScopeItem = z.infer<typeof ShareScopeItemSchema>;

export const ShareSchema = z.object({
  id: z.string().uuid(),
  resourceType: z.enum(SHAREABLE_RESOURCE_TYPES),
  resourceId: z.string().uuid(),
  user: ResourceUserSchema,
  createdAt: z.string().datetime().or(z.date()),
  scope: z.array(ShareScopeItemSchema).optional().default([]),
});
export type Share = z.infer<typeof ShareSchema>;

export const InboxItemSchema = z.object({
  id: z.string().uuid(),
  resourceType: z.enum(SHAREABLE_RESOURCE_TYPES),
  resourceId: z.string().uuid(),
  title: z.string(),
  subtitle: z.string().optional(),
  notebookId: z.string().uuid().nullable(),
  leafId: z.string().uuid().nullable(),
  owner: ResourceUserSchema,
  createdAt: z.string().datetime().or(z.date()),
});
export type InboxItem = z.infer<typeof InboxItemSchema>;

export interface SetPublicResult {
  id: string;
  isPublic: boolean;
  publicToken: string | null;
}

export interface PublicNotebook {
  id: string;
  title: string;
  description: string | null;
  color: string;
}

export interface PublicLeafNode {
  id: string;
  title: string;
  summary: string | null;
  parentId: string | null;
  position: number;
  children: PublicLeafNode[];
}

export interface PublicLeaf {
  id: string;
  title: string;
  content: string;
  summary: string | null;
}

export interface PublicQuestion {
  id: string;
  question: string;
  options: string[];
  questionType: string;
  explanation: string | null;
  theme: string | null;
}

export interface PublicFlashcard {
  id: string;
  front: string;
  back: string;
}

export interface PublicMockExamQuestion {
  id: string;
  question: string;
  options: string[];
  questionType: string;
  theme: string | null;
}

export interface PublicMockExam {
  id: string;
  title: string;
  description: string | null;
  timeLimit: number | null;
  questions: PublicMockExamQuestion[];
}

export type PublicResource =
  | PublicNotebook
  | PublicLeaf
  | PublicQuestion
  | PublicFlashcard
  | PublicMockExam;

export const RESOURCE_TYPE_LABELS: Record<ShareResourceType, string> = {
  notebook: 'Caderno',
  leaf: 'Folha',
  question: 'Questão',
  flashcard: 'Flashcard',
  mockExam: 'Simulado',
};

export const RESOURCE_TYPE_ICON_PATH: Record<ShareResourceType, string> = {
  notebook: 'caderno',
  leaf: 'folha',
  question: 'questao',
  flashcard: 'flashcard',
  mockExam: 'simulado',
};

export function buildPublicUrl(
  resourceType: ShareResourceType,
  resourceId: string,
  token: string,
): string {
  const { origin } = window.location;
  return `${origin}/public/${resourceType}/${resourceId}?token=${encodeURIComponent(token)}`;
}