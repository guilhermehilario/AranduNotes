import { z } from 'zod';

export const LeafTagSchema = z.object({
  leafId: z.string().uuid(),
  tagId: z.string().uuid(),
  tag: z.object({
    id: z.string().uuid(),
    userId: z.string().uuid(),
    name: z.string(),
    color: z.string(),
    createdAt: z.string().datetime().or(z.date()),
  }),
});

export type LeafTagType = z.infer<typeof LeafTagSchema>;

export interface Leaf {
  id: string;
  notebookId: string;
  title: string;
  content: string;
  rawText: string;
  summary?: string | null;
  parentId?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  children?: Leaf[];
  tags?: LeafTagType[];
  parent?: Leaf | null;
  archivedAt?: string | null;
  deletedAt?: string | null;
  position?: number;
}

// LeafSchema explicitly typed to break circular inference
export const LeafSchema: z.ZodType<Leaf> = z.object({
  id: z.string().uuid(),
  notebookId: z.string().uuid(),
  title: z.string().min(1, 'O título da folha é obrigatório').max(100, 'Título muito longo'),
  content: z.string(),
  rawText: z.string(),
  summary: z.string().optional().nullable(),
  parentId: z.string().uuid().nullable().optional(),
  createdAt: z.string().datetime().or(z.date()),
  updatedAt: z.string().datetime().or(z.date()),
  children: z.array(z.lazy(() => LeafSchema)).optional().default([]),
  tags: z.array(LeafTagSchema).optional().default([]),
  parent: z.lazy(() => LeafSchema).nullable().optional(),
  archivedAt: z.string().datetime().nullable().optional(),
  deletedAt: z.string().datetime().nullable().optional(),
  position: z.number().optional(),
});

export const CreateLeafSchema = z.object({
  title: z.string().min(1, 'O título da folha é obrigatório').max(100, 'Título muito longo'),
  content: z.string().optional(),
  rawText: z.string().optional(),
  parentId: z.string().uuid().optional(),
});

export type CreateLeafInput = z.infer<typeof CreateLeafSchema>;

export const UpdateLeafSchema = z.object({
  title: z.string().min(1, 'O título é obrigatório').optional(),
  content: z.string().optional(),
  rawText: z.string().optional(),
  summary: z.string().optional().nullable(),
  parentId: z.string().uuid().nullable().optional(),
});

export type UpdateLeafInput = z.infer<typeof UpdateLeafSchema>;
