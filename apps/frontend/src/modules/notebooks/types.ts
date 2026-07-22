import { z } from 'zod';

export const NotebookSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  title: z.string().min(1, 'O título do caderno é obrigatório').max(50, 'Título muito longo'),
  description: z.string().max(255, 'Descrição muito longa').optional().nullable(),
  color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Cor inválida (deve ser hex, ex: #FF0000)'),
  createdAt: z.string().datetime().or(z.date()),
  updatedAt: z.string().datetime().or(z.date()),
  leavesCount: z.number().int().nonnegative().default(0),
});

export type Notebook = z.infer<typeof NotebookSchema>;

export const CreateNotebookSchema = NotebookSchema.pick({
  title: true,
  description: true,
  color: true,
});

export type CreateNotebookInput = z.infer<typeof CreateNotebookSchema>;

export const UpdateNotebookSchema = CreateNotebookSchema.partial();

export type UpdateNotebookInput = z.infer<typeof UpdateNotebookSchema>;
