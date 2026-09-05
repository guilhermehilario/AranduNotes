import { User as PrismaUser } from "@prisma/client";
import { isEmail } from "class-validator";
import { ThemePreference, UserPublic } from "./auth.types";

// 🔐 SEC-012: rounds aumentado de 12 para 14 (recomendação 2026).
// Hashes existentes continuam verificáveis com bcrypt.compare (não é necessário
// re-hash); apenas novos hashes usam o custo maior.
export const SALT_ROUNDS = 14;
export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 128;

// 🔐 SEC-009: além do comprimento, a senha exige pelo menos uma letra maiúscula,
// uma minúscula e um número (requisito definido na auditoria — ver RELATORIO_SEGURANCA SEC-09).
const HAS_UPPERCASE = /[A-Z]/;
const HAS_LOWERCASE = /[a-z]/;
const HAS_DIGIT = /\d/;

export function validatePassword(password: string): boolean {
  return (
    password.length >= MIN_PASSWORD_LENGTH &&
    password.length <= MAX_PASSWORD_LENGTH &&
    HAS_UPPERCASE.test(password) &&
    HAS_LOWERCASE.test(password) &&
    HAS_DIGIT.test(password)
  );
}

/** Mensagem exibida ao usuário quando a senha não cumpre os requisitos SEC-009. */
export function passwordRequirementMessage(): string {
  return `A senha deve ter entre ${MIN_PASSWORD_LENGTH} e ${MAX_PASSWORD_LENGTH} caracteres, incluindo pelo menos uma letra maiúscula, uma minúscula e um número.`;
}

// 🔐 SEC-014: regex própria substituída pela validação robusta do class-validator
// (mesmo validador usado pelos DTOs via @IsEmail). A regex antiga
// /^[^\s@]+@[^\s@]+\.[^\s@]+$/ aceitava emails inválidos como "a@b..c" ou
// "a@b.c..d".
export function validateEmail(email: string): boolean {
  return isEmail(email);
}

const THEME_VALUES: ThemePreference[] = ["light", "dark", "system"];

function normalizeTheme(theme: string | null | undefined): ThemePreference {
  return THEME_VALUES.includes(theme as ThemePreference) && theme
    ? (theme as ThemePreference)
    : "system";
}

export function stripPassword(user: PrismaUser): UserPublic {
  // Retorna apenas os campos públicos, omitindo password e deletedAt.
  // theme é string no Prisma; normaliza para "light" | "dark" | "system"
  // (registros antigos sem valor válido caem em "system").
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl,
    emailVerified: user.emailVerified,
    theme: normalizeTheme(user.theme),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
