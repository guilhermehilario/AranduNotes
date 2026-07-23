import { Controller, Get } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Controller()
export class AppController {
  constructor(
    private readonly prisma: PrismaService,
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
}
