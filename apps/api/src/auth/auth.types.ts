export interface UserPublic {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}
