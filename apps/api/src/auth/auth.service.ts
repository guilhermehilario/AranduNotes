import { Injectable } from "@nestjs/common";
import { UserPublic } from "./auth.types";
import { AuthCoreService } from "./auth-core.service";
import { PasswordService } from "./password.service";
import { ProfileService } from "./profile.service";
import { VerificationService } from "./verification.service";
import { DeleteAccountService } from "./delete-account.service";

/**
 * AuthService — Facade que delega para serviços especializados.
 *
 * Mantém a mesma interface pública para compatibilidade com:
 * - AuthController
 * - JwtStrategy
 * - Outros módulos que importam AuthModule
 *
 * Responsabilidades delegadas:
 * - AuthCoreService: register, login, refresh, validateUser, generateTokens
 * - PasswordService: changePassword, forgotPassword, resetPassword
 * - ProfileService: getProfile, updateProfile
 * - VerificationService: verifyEmail, resendVerification
 * - DeleteAccountService: sendDeleteConfirmation, confirmDeleteAccount
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly core: AuthCoreService,
    private readonly password: PasswordService,
    private readonly profile: ProfileService,
    private readonly verification: VerificationService,
    private readonly deletion: DeleteAccountService,
  ) {}

  // ── Auth Core ──

  async register(
    name: string,
    email: string,
    password: string,
    acceptedTerms: boolean,
  ): Promise<{ message: string; email: string }> {
    return this.core.register(name, email, password, acceptedTerms);
  }

  async login(
    email: string,
    password: string,
    existingRefreshToken?: string,
  ): Promise<{
    user: UserPublic;
    accessToken: string;
    refreshToken: string;
  }> {
    return this.core.login(email, password, existingRefreshToken);
  }

  async refresh(
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    return this.core.refresh(refreshToken);
  }

  async validateUser(userId: string): Promise<UserPublic | null> {
    return this.core.validateUser(userId);
  }

  // ── Password ──

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    return this.password.changePassword(userId, currentPassword, newPassword);
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    return this.password.forgotPassword(email);
  }

  async resetPassword(
    token: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    return this.password.resetPassword(token, newPassword);
  }

  // ── Profile ──

  async getProfile(userId: string): Promise<UserPublic> {
    return this.profile.getProfile(userId);
  }

  async updateProfile(
    userId: string,
    data: { name?: string; avatarUrl?: string; theme?: string },
  ): Promise<UserPublic> {
    return this.profile.updateProfile(userId, data);
  }

  // ── Email Verification ──

  async verifyEmail(token: string): Promise<{ message: string }> {
    return this.verification.verifyEmail(token);
  }

  async resendVerification(email: string): Promise<{ message: string }> {
    return this.verification.resendVerification(email);
  }

  // ── Account Deletion ──

  async sendDeleteConfirmation(
    userId: string,
  ): Promise<{ message: string; token: string; code?: string }> {
    return this.deletion.sendDeleteConfirmation(userId);
  }

  async confirmDeleteAccount(
    token: string,
    code: string,
  ): Promise<{ message: string }> {
    return this.deletion.confirmDeleteAccount(token, code);
  }
}
