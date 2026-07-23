import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;
  /** true se o SMTP estiver configurado */
  private isConfigured = false;
  private readonly frontendUrl: string;
  private readonly fromName: string;
  private readonly fromEmail: string;
  private readonly smtpHost: string | null = null;
  private readonly smtpPort: number | null = null;

  constructor(private readonly configService: ConfigService) {
    this.frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';

    const host = this.configService.get<string>('SMTP_HOST');
    const portString = this.configService.get<string>('SMTP_PORT');
    const port = portString ? parseInt(portString, 10) : 587;
    const user = this.configService.get<string>('EMAIL_USER');
    const pass = this.configService.get<string>('EMAIL_PASSWORD');
    const rawFrom =
      this.configService.get<string>('SMTP_FROM') || 'noreply@arandu.app';

    // Timeouts configuráveis via env (em ms)
    const connectionTimeout =
      parseInt(this.configService.get<string>('SMTP_CONNECTION_TIMEOUT') || '10000', 10);
    const greetingTimeout =
      parseInt(this.configService.get<string>('SMTP_GREETING_TIMEOUT') || '10000', 10);
    const socketTimeout =
      parseInt(this.configService.get<string>('SMTP_SOCKET_TIMEOUT') || '30000', 10);

    // Extrai nome e email do campo from (ex: "Nome <email@dominio.com>")
    const fromMatch = rawFrom.match(/^(.+)\s*<(.+)>$/);
    this.fromName = fromMatch ? fromMatch[1].trim() : 'Arandu';
    this.fromEmail = fromMatch ? fromMatch[2].trim() : rawFrom;

    // ── Configura Nodemailer com SMTP ──
    if (host && user && pass) {
      this.smtpHost = host;
      this.smtpPort = port;
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
        connectionTimeout,
        greetingTimeout,
        socketTimeout,
        // Desabilita TLS se não for necessário (alguns relays exigem)
        requireTLS: port === 465 || port === 587,
        // Pool de conexões — maxMessages: 1 força uma conexão nova por envio
        // para evitar reuso de conexões quebradas após timeout
        pool: true,
        maxConnections: 3,
        maxMessages: 1,
      });
      this.isConfigured = true;
      this.logger.log(
        `Email service configured: SMTP ${host}:${port} (from: ${this.fromName} <${this.fromEmail}>) ` +
        `timeouts: conn=${connectionTimeout}ms greet=${greetingTimeout}ms socket=${socketTimeout}ms`,
      );
    } else {
      this.logger.warn(
        'SMTP não configurado. Defina SMTP_HOST, SMTP_USER e SMTP_PASS no .env. ' +
        'E-mails serão simulados no console.',
      );
    }
  }

  /** Retorna se o SMTP está configurado para envio real */
  get isSmtpConfigured(): boolean {
    return this.isConfigured;
  }

  /**
   * Verifica ativamente se o servidor SMTP está acessível.
   * Tenta estabelecer uma conexão e, se bem-sucedida, a encerra.
   * Não envia nenhum e-mail.
   */
  async checkConnection(): Promise<{ connected: boolean; latencyMs?: number; error?: string }> {
    if (!this.isConfigured || !this.transporter) {
      return { connected: false, error: 'SMTP não configurado' };
    }

    const start = Date.now();
    try {
      // Verifica se o transporter consegue estabelecer conexão
      // O Nodemailer verify() tenta um handshake SMTP real
      await this.transporter.verify();
      const latencyMs = Date.now() - start;
      return { connected: true, latencyMs };
    } catch (error) {
      const err = error as Error;
      return {
        connected: false,
        latencyMs: Date.now() - start,
        error: err.message,
      };
    }
  }

  /** Retorna informações da configuração SMTP (sem senhas) */
  getConfigInfo() {
    if (!this.isConfigured) {
      return {
        configured: false,
        host: null,
        port: null,
        fromName: this.fromName,
        fromEmail: this.fromEmail,
      };
    }

    return {
      configured: true,
      host: this.smtpHost,
      port: this.smtpPort,
      fromName: this.fromName,
      fromEmail: this.fromEmail,
    };
  }

  async sendEmail(options: {
    to: string;
    subject: string;
    html: string;
    text?: string;
  }): Promise<void> {
    // ── Modo dev/sem SMTP: apenas log ──
    if (!this.isConfigured || !this.transporter) {
      this.logger.log('━━━━━━━━━━━━ EMAIL (DEV MODE) ━━━━━━━━━━━━━');
      this.logger.log(`To: ${options.to}`);
      this.logger.log(`From: ${this.fromName} <${this.fromEmail}>`);
      this.logger.log(`Subject: ${options.subject}`);
      this.logger.log(`Body:\n${options.html.replace(/<[^>]*>/g, '')}`);
      this.logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      return;
    }

    // ── Envio via Nodemailer / SMTP ──
    try {
      const info = await this.transporter.sendMail({
        from: `${this.fromName} <${this.fromEmail}>`,
        to: options.to,
        subject: options.subject,
        text: options.text || options.html.replace(/<[^>]*>/g, ''),
        html: options.html,
      });
      this.logger.log(`Email sent via SMTP: ${info.messageId}`);
    } catch (error) {
      const err = error as Error & { code?: string };
      this.logger.error('Failed to send email via SMTP', err);

      // Mensagens específicas por tipo de erro
      if (err.code === 'ETIMEDOUT' || err.code === 'ESOCKET') {
        throw new Error(
          'O servidor de e-mail não respondeu a tempo (timeout). ' +
          'Verifique se o host SMTP está acessível e as configurações de firewall.',
        );
      }
      if (err.code === 'ECONNREFUSED') {
        throw new Error(
          'Conexão recusada pelo servidor SMTP. ' +
          'Verifique se o host e porta SMTP estão corretos.',
        );
      }
      if (err.code === 'EAUTH') {
        throw new Error(
          'Autenticação SMTP falhou. Verifique SMTP_USER e SMTP_PASS.',
        );
      }

      throw new Error(
        'Falha ao enviar e-mail. Verifique as configurações de SMTP e tente novamente.',
      );
    }
  }

  async sendVerificationEmail(
    to: string,
    userName: string,
    verificationToken: string,
  ): Promise<void> {
    const subject = 'Confirme seu e-mail - Arandu';
    const verificationUrl = `${this.frontendUrl}/verify-email?token=${verificationToken}`;

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; background: #fafafa; border-radius: 16px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #1e293b; font-size: 24px; margin: 0;">Arandu</h1>
          <p style="color: #64748b; font-size: 14px; margin: 4px 0 0;">Confirmação de E-mail</p>
        </div>

        <div style="background: white; border-radius: 12px; padding: 24px; border: 1px solid #e2e8f0;">
          <p style="color: #1e293b; font-size: 16px; line-height: 1.5;">Olá, <strong>${userName}</strong>!</p>

          <p style="color: #475569; font-size: 14px; line-height: 1.6;">
            Obrigado por criar sua conta no Arandu! Para começar a usar, confirme seu endereço de e-mail clicando no botão abaixo:
          </p>

          <div style="text-align: center; margin: 24px 0;">
            <a href="${verificationUrl}"
               style="display: inline-block; background: #aa3bff; color: white; font-size: 16px; font-weight: 700; padding: 14px 32px; border-radius: 12px; text-decoration: none;">
              Confirmar E-mail
            </a>
          </div>

          <p style="color: #64748b; font-size: 13px; line-height: 1.5; text-align: center;">
            Se o botão não funcionar, copie e cole o link abaixo no seu navegador:<br>
            <span style="color: #aa3bff; font-size: 12px; word-break: break-all;">${verificationUrl}</span>
          </p>

          <p style="color: #94a3b8; font-size: 12px; margin-top: 20px; text-align: center;">
            Este link expira em 24 horas.
          </p>
        </div>

        <div style="text-align: center; margin-top: 16px;">
          <p style="color: #94a3b8; font-size: 12px;">
            Arandu • Plataforma de Estudos Inteligente<br>
            Se você não criou uma conta, ignore este e-mail.
          </p>
        </div>
      </div>
    `;

    await this.sendEmail({ to, subject, html });
  }

  async sendDeleteConfirmationEmail(
    to: string,
    userName: string,
    confirmationCode: string,
  ): Promise<void> {
    const subject = 'Confirmação de Exclusão de Conta - Arandu';

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; background: #fafafa; border-radius: 16px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #1e293b; font-size: 24px; margin: 0;">Arandu</h1>
          <p style="color: #64748b; font-size: 14px; margin: 4px 0 0;">Confirmação de Exclusão de Conta</p>
        </div>

        <div style="background: white; border-radius: 12px; padding: 24px; border: 1px solid #e2e8f0;">
          <p style="color: #1e293b; font-size: 16px; line-height: 1.5;">Olá, <strong>${userName}</strong>!</p>

          <p style="color: #475569; font-size: 14px; line-height: 1.6;">
            Recebemos uma solicitação de exclusão da sua conta no Arandu.
            Para confirmar e prosseguir com a exclusão permanente, utilize o código abaixo:
          </p>

          <div style="text-align: center; margin: 24px 0; padding: 16px; background: #fef2f2; border-radius: 12px; border: 1px solid #fecaca;">
            <p style="color: #dc2626; font-size: 12px; font-weight: 600; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 0.05em;">
              Código de Confirmação
            </p>
            <span style="font-size: 28px; font-weight: 800; letter-spacing: 0.15em; color: #b91c1c; font-family: 'Courier New', monospace;">
              ${confirmationCode}
            </span>
            <p style="color: #94a3b8; font-size: 11px; margin: 8px 0 0;">
              Este código expira em 15 minutos.
            </p>
          </div>

          <p style="color: #475569; font-size: 14px; line-height: 1.6;">
            Se você não solicitou a exclusão da sua conta, ignore este e-mail.
            Nenhuma ação será tomada sem a confirmação através do código acima.
          </p>
        </div>

        <div style="text-align: center; margin-top: 16px;">
          <p style="color: #94a3b8; font-size: 12px;">
            Arandu • Plataforma de Estudos Inteligente<br>
            Se tiver dúvidas, entre em contato com nosso suporte.
          </p>
        </div>
      </div>
    `;

    await this.sendEmail({ to, subject, html });
  }

  async sendPasswordResetEmail(
    to: string,
    userName: string,
    resetToken: string,
  ): Promise<void> {
    const subject = 'Recuperação de Senha - Arandu';
    const resetUrl = `${this.frontendUrl}/reset-password?token=${resetToken}`;

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; background: #fafafa; border-radius: 16px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #1e293b; font-size: 24px; margin: 0;">Arandu</h1>
          <p style="color: #64748b; font-size: 14px; margin: 4px 0 0;">Recuperação de Senha</p>
        </div>

        <div style="background: white; border-radius: 12px; padding: 24px; border: 1px solid #e2e8f0;">
          <p style="color: #1e293b; font-size: 16px; line-height: 1.5;">Olá, <strong>${userName}</strong>!</p>

          <p style="color: #475569; font-size: 14px; line-height: 1.6;">
            Recebemos uma solicitação de redefinição de senha para sua conta no Arandu.
            Para criar uma nova senha, clique no botão abaixo:
          </p>

          <div style="text-align: center; margin: 24px 0;">
            <a href="${resetUrl}"
               style="display: inline-block; background: #aa3bff; color: white; font-size: 16px; font-weight: 700; padding: 14px 32px; border-radius: 12px; text-decoration: none;">
              Redefinir Senha
            </a>
          </div>

          <p style="color: #64748b; font-size: 13px; line-height: 1.5; text-align: center;">
            Se o botão não funcionar, copie e cole o link abaixo no seu navegador:<br>
            <span style="color: #aa3bff; font-size: 12px; word-break: break-all;">${resetUrl}</span>
          </p>

          <p style="color: #94a3b8; font-size: 12px; margin-top: 20px; text-align: center;">
            Este link expira em 1 hora. Se você não solicitou a redefinição, ignore este e-mail.
          </p>
        </div>

        <div style="text-align: center; margin-top: 16px;">
          <p style="color: #94a3b8; font-size: 12px;">
            Arandu • Plataforma de Estudos Inteligente
          </p>
        </div>
      </div>
    `;

    await this.sendEmail({ to, subject, html });
  }
}
