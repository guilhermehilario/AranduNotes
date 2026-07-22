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
import { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
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
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(dto.email, dto.password);
    this.setRefreshCookie(res, result.refreshToken);
    return { user: result.user, accessToken: result.accessToken };
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: this.isSecure,
      sameSite: this.sameSite,
    });
    return { message: 'Deslogado com sucesso' };
  }

  @Post('refresh')
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
    } catch {
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
  async forgotPassword(@Body() body: { email: string }) {
    return this.authService.forgotPassword(body.email);
  }

  @Post('reset-password')
  async resetPassword(
    @Body() body: { token: string; password: string },
  ) {
    return this.authService.resetPassword(body.token, body.password);
  }

  @Post('verify-email')
  async verifyEmail(@Body() body: { token: string }) {
    return this.authService.verifyEmail(body.token);
  }

  @Post('resend-verification')
  async resendVerification(@Body() body: { email: string }) {
    return this.authService.resendVerification(body.email);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  getProfile(@CurrentUser() user: any) {
    return user;
  }

  @Put('profile')
  @UseGuards(JwtAuthGuard)
  async updateProfile(
    @CurrentUser('id') userId: string,
    @Body() body: { name?: string; avatarUrl?: string },
  ) {
    return this.authService.updateProfile(userId, body);
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  async changePassword(
    @CurrentUser('id') userId: string,
    @Body() body: { currentPassword: string; newPassword: string },
  ) {
    return this.authService.changePassword(
      userId,
      body.currentPassword,
      body.newPassword,
    );
  }

  @Post('send-delete-confirmation')
  @UseGuards(JwtAuthGuard)
  async sendDeleteConfirmation(@CurrentUser('id') userId: string) {
    return this.authService.sendDeleteConfirmation(userId);
  }

  @Post('confirm-deletion')
  @UseGuards(JwtAuthGuard)
  async confirmDeletion(
    @CurrentUser('id') userId: string,
    @Body() body: { token: string; code: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.confirmDeleteAccount(
      body.token,
      body.code,
    );
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: this.isSecure,
      sameSite: this.sameSite,
    });
    return result;
  }
}
