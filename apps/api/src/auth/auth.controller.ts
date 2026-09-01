import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Res,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Logger } from '@nestjs/common';
import { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { UserPublic } from './auth.types';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { ConfirmDeletionDto } from './dto/confirm-deletion.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  private readonly isSecure = process.env.NODE_ENV === 'production';

  // Usa SameSite=None em produção para permitir cookies em frontends
  // hospedados em domínios separados (ex: frontend em Vercel/Cloudflare,
  // backend em Fly.io). Em desenvolvimento mantém 'lax'.
  private readonly sameSite = this.isSecure ? 'none' as const : 'lax' as const;

  private setRefreshCookie(res: Response, refreshToken: string) {
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: this.isSecure,
      sameSite: this.sameSite,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }

  @Post('register')
  // 🔐 SEC-023: rate limit específico para evitar abuso/criação em massa
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async register(
    @Body() dto: RegisterDto,
  ) {
    const result = await this.authService.register(
      dto.name,
      dto.email,
      dto.password,
      dto.acceptedTerms,
    );
    return result;
  }

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    // Verifica sessão existente: se o cookie refreshToken for válido,
    // o usuário já está logado e o login é rejeitado.
    const existingRefreshToken = req.cookies?.refreshToken;
    const result = await this.authService.login(
      dto.email,
      dto.password,
      existingRefreshToken,
    );
    this.setRefreshCookie(res, result.refreshToken);
    return { user: result.user, accessToken: result.accessToken };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    // 🔐 Logout server-side: revoga o refresh token no banco ANTES de limpar o
    // cookie — um cookie roubado não pode mais ser usado para renovar a sessão.
    const refreshToken = req.cookies?.refreshToken;
    if (refreshToken) {
      await this.authService.logout(refreshToken);
    }
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: this.isSecure,
      sameSite: this.sameSite,
    });
    return { message: 'Deslogado com sucesso' };
  }

  /** 🔐 MÉDIO-19: Logout de todos os dispositivos — revoga todos os refresh tokens */
  @Post('logout-all')
  @UseGuards(JwtAuthGuard)
  async logoutAll(
    @CurrentUser('id') userId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logoutAll(userId);
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: this.isSecure,
      sameSite: this.sameSite,
    });
    return { message: 'Deslogado de todos os dispositivos' };
  }

  @Post('refresh')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      res.status(401);
      return { error: 'Refresh token ausente' };
    }

    try {
      const result = await this.authService.refresh(refreshToken);
      // Renova o cookie de refresh (rotação de token)
      this.setRefreshCookie(res, result.refreshToken);
      return { accessToken: result.accessToken };
    } catch (error) {
      // Loga o erro REAL para observabilidade — o cliente recebe apenas o 401
      // genérico (erros de banco não-retryáveis também caem aqui via withConnection).
      this.logger.warn(
        `Refresh falhou: ${(error as Error)?.message || 'erro desconhecido'}`,
      );
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: this.isSecure,
        sameSite: this.sameSite,
      });
      res.status(401);
      return { error: 'Refresh token inválido ou expirado' };
    }
  }

  @Post('forgot-password')
  // 🔐 SEC-023: rate limit específico contra brute force/abuso de e-mail
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Post('reset-password')
  // 🔐 SEC-023: rate limit específico contra brute force de tokens de reset
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.password);
  }

  @Post('verify-email')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto.token);
  }

  @Post('resend-verification')
  // 🔐 SEC-023: rate limit específico contra spam de e-mails de verificação
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async resendVerification(@Body() dto: ResendVerificationDto) {
    return this.authService.resendVerification(dto.email);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  getProfile(@CurrentUser() user: UserPublic) {
    return user;
  }

  @Put('profile')
  @UseGuards(JwtAuthGuard)
  async updateProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.authService.updateProfile(userId, dto);
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  async changePassword(
    @CurrentUser('id') userId: string,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(
      userId,
      dto.currentPassword,
      dto.newPassword,
    );
  }

  @Post('send-delete-confirmation')
  @UseGuards(JwtAuthGuard)
  // 🔐 BAIXO-42: Rate limit contra spam de e-mails de exclusão (auto-abuso)
  @Throttle({ default: { limit: 3, ttl: 900000 } })
  async sendDeleteConfirmation(@CurrentUser('id') userId: string) {
    return this.authService.sendDeleteConfirmation(userId);
  }

  @Post('confirm-deletion')
  @UseGuards(JwtAuthGuard)
  // 🔐 CRIT-5: Rate limit contra brute force do código de confirmação
  @Throttle({ default: { limit: 5, ttl: 900000 } })
  async confirmDeletion(
    @CurrentUser('id') userId: string,
    @Body() dto: ConfirmDeletionDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.confirmDeleteAccount(
      dto.token,
      dto.code,
      userId,
    );
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: this.isSecure,
      sameSite: this.sameSite,
    });
    return result;
  }
}
