export const SHAREABLE_TYPES = [
  "notebook",
  "leaf",
  "question",
  "flashcard",
  "mockExam",
] as const;

export type ResourceType = (typeof SHAREABLE_TYPES)[number];

export type AccessLevel = "owner" | "editor" | "viewer" | "none";

/** Contexto de um recurso compartilhável resolvido no banco. */
export interface ShareContext {
  ownerId: string;
  deletedAt: Date | null;
  notebookId: string | null;
  leafId: string | null;
  /** Cadeia [recurso, ancestral mais próximo...] para acesso público. */
  publicChain: { type: ResourceType; id: string; isPublic: boolean; token: string | null }[];
}