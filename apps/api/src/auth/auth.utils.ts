import { UserPublic } from "./auth.types";

export const SALT_ROUNDS = 12;
export const MIN_PASSWORD_LENGTH = 8;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

export function validatePassword(password: string): boolean {
  return password.length >= MIN_PASSWORD_LENGTH;
}

export function stripPassword(user: {
  id: string;
  name: string;
  email: string;
  password: string;
  avatarUrl: string;
  emailVerified: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): UserPublic {
  const { password: _, deletedAt: __, ...rest } = user;
  return rest;
}
