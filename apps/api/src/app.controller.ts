import { Controller, Get } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { EmailService } from './common/email/email.service';

@Controller()
export class AppController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  @Get()
  getStatus() {
    return {
      message: 'API Revisa Aula está ativa!',
      status: 'OK',
    };
  }

  @Get('health')
  async getHealth() {
    const dbHealthy = await this.prisma.isHealthy();

    const healthStatus = dbHealthy ? 'healthy' : 'degraded';
    const httpStatusCode = dbHealthy ? 200 : 503;

    return {
      status: healthStatus,
      database: dbHealthy ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  /**
   * Endpoint de warm-up: usado pelo Render ou serviços de monitoramento
   * para "aquecer" a aplicação antes de enviar tráfego real.
   * Força a conexão com o banco e retorna o status.
   */
  @Get('warmup')
  async warmUp() {
    const startTime = Date.now();

    try {
      await this.prisma.ensureConnection();
      const duration = Date.now() - startTime;

      return {
        status: 'ready',
        database: 'connected',
        warmupTime: `${duration}ms`,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'failed',
        database: 'disconnected',
        error: (error as Error).message,
        warmupTime: `${Date.now() - startTime}ms`,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Endpoint de diagnóstico: retorna status detalhado de todas as
   * conexões e serviços externos da aplicação.
   *
   * - Banco de dados (Prisma/LibSQL)
   * - SMTP (e-mail)
   * - Informações do servidor (uptime, memória, Node)
   *
   * Útil para debugging em produção, especialmente após cold starts.
   */
  @Get('debug/connections')
  async getConnectionsStatus() {
    const startTime = Date.now();

    // Executa diagnósticos em paralelo
    const [dbInfo, smtpResult, smtpConfig] = await Promise.all([
      this.prisma.getConnectionInfo(),
      this.emailService.checkConnection(),
      this.emailService.getConfigInfo(),
    ]);

    const totalTime = Date.now() - startTime;

    const memoryUsage = process.memoryUsage();

    return {
      timestamp: new Date().toISOString(),
      totalDiagnosticTime: `${totalTime}ms`,
      server: {
        uptime: process.uptime(),
        uptimeFormatted: this.formatUptime(process.uptime()),
        nodeVersion: process.version,
        platform: process.platform,
        environment: process.env.NODE_ENV || 'development',
        memory: {
          rss: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`,
          heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
          heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`,
        },
      },
      connections: {
        database: {
          name: dbInfo.driver,
          connected: dbInfo.connected,
          latency: dbInfo.latencyMs ? `${dbInfo.latencyMs}ms` : null,
          url: dbInfo.databaseUrl,
          poolStatus: dbInfo.poolStatus,
          error: dbInfo.error || null,
        },
        email: {
          configured: smtpConfig.configured,
          connected: smtpResult.connected,
          latency: smtpResult.latencyMs ? `${smtpResult.latencyMs}ms` : null,
          host: smtpConfig.host,
          port: smtpConfig.port,
          fromName: smtpConfig.fromName,
          fromEmail: smtpConfig.fromEmail,
          error: smtpResult.error || null,
        },
        // Placeholder para futuras integrações (Redis, cache, etc.)
        // redis: null,
      },
      summary: {
        allConnected: dbInfo.connected && (!smtpConfig.configured || smtpResult.connected),
        degraded: !dbInfo.connected || (smtpConfig.configured && !smtpResult.connected),
      },
    };
  }

  /** Formata segundos em tempo legível */
  private formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    const parts: string[] = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    parts.push(`${secs}s`);

    return parts.join(' ');
  }
}
