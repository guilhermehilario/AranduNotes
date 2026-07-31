import { User as PrismaUser } from "@prisma/client";
import { ThemePreference, UserPublic } from "./auth.types";

export const SALT_ROUNDS = 12;
export const MIN_PASSWORD_LENGTH = 8;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

export function validatePassword(password: string): boolean {
  return password.length >= MIN_PASSWORD_LENGTH;
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
