import { Controller, Get, Logger, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { PrismaService } from './prisma/prisma.service';
import { EmailService } from './common/email/email.service';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';

@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);

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
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async getHealth() {
    const dbHealthy = await this.prisma.isHealthy();

    const healthStatus = dbHealthy ? 'healthy' : 'degraded';

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
  @Throttle({ default: { limit: 10, ttl: 60000 } })
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
      // 🔐 SEC: Não expor mensagem de erro detalhada ao cliente
      this.logger.error(`Warmup failed: ${(error as Error).message}`);
      return {
        status: 'failed',
        database: 'disconnected',
        warmupTime: `${Date.now() - startTime}ms`,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Endpoint de diagnóstico: retorna status detalhado de todas as
   * conexões e serviços externos da aplicação.
   *
   * 🔐 ALTO-7: Em produção, retorna apenas status resumido (sem driver,
   * memória ou detalhes SMTP). Detalhes completos só em dev/test.
   */
  @Get('debug/connections')
  @UseGuards(JwtAuthGuard)
  async getConnectionsStatus() {
    const isProduction = process.env.NODE_ENV === 'production';
    const startTime = Date.now();

    // Executa diagnósticos em paralelo
    const [dbInfo, smtpResult, smtpConfig] = await Promise.all([
      this.prisma.getConnectionInfo(),
      this.emailService.checkConnection(),
      this.emailService.getConfigInfo(),
    ]);

    const totalTime = Date.now() - startTime;
    const memoryUsage = process.memoryUsage();

    if (isProduction) {
      // 🔐 Produção: resposta sanitizada — sem detalhes de infraestrutura
      return {
        timestamp: new Date().toISOString(),
        database: dbInfo.connected ? 'healthy' : 'degraded',
        email: !smtpConfig.configured ? 'not configured' : (smtpResult.connected ? 'healthy' : 'degraded'),
      };
    }

    // Desenvolvimento: resposta completa
    return {
      timestamp: new Date().toISOString(),
      totalDiagnosticTime: `${totalTime}ms`,
      server: {
        uptime: this.formatUptime(process.uptime()),
        environment: process.env.NODE_ENV || 'development',
        memory: {
          rss: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`,
          heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
        },
      },
      connections: {
        database: {
          name: dbInfo.driver,
          connected: dbInfo.connected,
          latency: dbInfo.latencyMs ? `${dbInfo.latencyMs}ms` : null,
          poolStatus: dbInfo.poolStatus,
          error: dbInfo.error || null,
        },
        email: {
          configured: smtpConfig.configured,
          connected: smtpResult.connected,
          latency: smtpResult.latencyMs ? `${smtpResult.latencyMs}ms` : null,
          error: smtpResult.error || null,
        },
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
