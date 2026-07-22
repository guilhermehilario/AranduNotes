import { api } from "../../../core/api/client";
import type { LoginInput, RegisterInput, AuthResponse, User } from "../types";

export const authService = {
  async login(credentials: LoginInput): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>("/auth/login", credentials);
    return response.data;
  },

  async register(
    data: RegisterInput,
  ): Promise<{ message: string; email: string }> {
    // confirmPassword é validação exclusiva do frontend — o backend não precisa
    const { confirmPassword: _, ...payload } = data;
    const response = await api.post<{ message: string; email: string }>(
      "/auth/register",
      payload,
    );
    return response.data;
  },

  async logout(): Promise<void> {
    await api.post("/auth/logout");
  },

  async getProfile(): Promise<User> {
    const response = await api.get<User>("/auth/profile");
    return response.data;
  },

  async forgotPassword(email: string): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>(
      "/auth/forgot-password",
      { email },
    );
    return response.data;
  },

  async resetPassword(
    token: string,
    password: string,
  ): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>(
      "/auth/reset-password",
      { token, password },
    );
    return response.data;
  },

  async verifyEmail(token: string): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>("/auth/verify-email", {
      token,
    });
    return response.data;
  },

  async resendVerification(email: string): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>(
      "/auth/resend-verification",
      { email },
    );
    return response.data;
  },

  async sendDeleteConfirmation(): Promise<{ message: string; token: string }> {
    const response = await api.post<{ message: string; token: string }>(
      "/auth/send-delete-confirmation",
    );
    return response.data;
  },

  async confirmDeletion(
    token: string,
    code: string,
  ): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>(
      "/auth/confirm-deletion",
      { token, code },
    );
    return response.data;
  },
};
export default authService;
