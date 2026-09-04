export const SHAREABLE_TYPES = [
  "notebook",
  "leaf",
  "question",
  "flashcard",
  "mockExam",
] as const;

export type ResourceType = (typeof SHAREABLE_TYPES)[number];

export type AccessLevel = "owner" | "editor" | "viewer" | "none";

/** Permissão concedida a um destinatário de compartilhamento. */
export type SharePermission = "viewer" | "editor";

/**
 * Capacidades de edição de um destinatário (caderno).
 * Só são verdadeiras quando o compartilhamento é 'editor' e o dono
 * autorizou cada ação individualmente. Viewers têm todas false.
 */
export interface ShareCapabilities {
  canEditContent: boolean;
  canCreateLeaves: boolean;
  canUploadFiles: boolean;
}

export const NO_CAPABILITIES: ShareCapabilities = {
  canEditContent: false,
  canCreateLeaves: false,
  canUploadFiles: false,
};

export const FULL_CAPABILITIES: ShareCapabilities = {
  canEditContent: true,
  canCreateLeaves: true,
  canUploadFiles: true,
};

/** Contexto de um recurso compartilhável resolvido no banco. */
export interface ShareContext {
  ownerId: string;
  deletedAt: Date | null;
  notebookId: string | null;
  leafId: string | null;
  /** Cadeia [recurso, ancestral mais próximo...] para acesso público. */
  publicChain: { type: ResourceType; id: string; isPublic: boolean; token: string | null }[];
}

/** Escopo de acesso para compartilhamentos de caderno. */
export interface NotebookShareScopeItem {
  id: string;
  leafId: string;
}

/** Share com informações de scope (para cadernos). */
export interface ShareWithScope extends ShareCapabilities {
  id: string;
  resourceType: ResourceType;
  resourceId: string;
  user: { id: string; name: string; email: string };
  permission: SharePermission;
  createdAt: Date;
  scope: NotebookShareScopeItem[];
}