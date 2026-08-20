import { createHash } from "node:crypto";

/**
 * 🔐 Hash SHA-256 de tokens (reset de senha, verificação de email).
 * Apenas o hash é persistido no banco — um vazamento do banco não expõe
 * tokens utilizáveis.
 */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
