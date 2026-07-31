export type ThemePreference = "light" | "dark" | "system";

export interface UserPublic {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  emailVerified: boolean;
  theme: ThemePreference;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}
