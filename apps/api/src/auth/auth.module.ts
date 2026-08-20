import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthCoreService } from './auth-core.service';
import { PasswordService } from './password.service';
import { ProfileService } from './profile.service';
import { VerificationService } from './verification.service';
import { DeleteAccountService } from './delete-account.service';
import { JwtStrategy } from './jwt.strategy';
import { EmailService } from '../common/email/email.service';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
        signOptions: { expiresIn: '15m' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthCoreService,
    PasswordService,
    ProfileService,
    VerificationService,
    DeleteAccountService,
    JwtStrategy,
    EmailService,
  ],
  exports: [AuthService, JwtModule, PassportModule, EmailService],
})
export class AuthModule {}
