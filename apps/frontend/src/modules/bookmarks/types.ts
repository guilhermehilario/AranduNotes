import { z } from 'zod';

export const BookmarkSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  leafId: z.string().uuid().nullable().optional(),
  notebookId: z.string().uuid().nullable().optional(),
  title: z.string(),
  path: z.string(),
  createdAt: z.string().datetime().or(z.date()),
  leaf: z.object({
    title: z.string(),
    notebookId: z.string().uuid(),
  }).nullable().optional(),
  notebook: z.object({
    title: z.string(),
  }).nullable().optional(),
});

export type Bookmark = z.infer<typeof BookmarkSchema>;

export const CreateBookmarkSchema = z.object({
  leafId: z.string().uuid().optional(),
  notebookId: z.string().uuid().optional(),
  title: z.string().min(1, 'O título é obrigatório'),
  path: z.string().min(1, 'O caminho é obrigatório'),
});

export type CreateBookmarkInput = z.infer<typeof CreateBookmarkSchema>;
