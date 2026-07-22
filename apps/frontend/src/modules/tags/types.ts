import { z } from 'zod';

export const TagSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  name: z.string().min(1).max(50),
  color: z.string().default('#aa3bff'),
  createdAt: z.string().datetime().or(z.date()),
});

export type Tag = z.infer<typeof TagSchema>;

export const CreateTagSchema = z.object({
  name: z.string().min(1, 'O nome da tag é obrigatório').max(50, 'Nome muito longo'),
  color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Cor inválida').default('#aa3bff'),
});

export type CreateTagInput = z.infer<typeof CreateTagSchema>;

