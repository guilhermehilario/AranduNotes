import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';

const MAX_RETRIES = 5;
const BASE_DELAY_MS = 1000;
const MAX_DELAY_MS = 10_000;

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  private isConnected = false;
  /** Mutex simples para evitar múltiplas reconexões concorrentes */
  private connectLock = false;

  constructor() {
    const adapter = new PrismaLibSql({
      url: process.env.DATABASE_URL || 'file:./dev.db',
    });
    super({ adapter });
  }

  /**
   * Conecta ao banco com retry com backoff exponencial.
   * Usada durante a inicialização e também para reconexão.
   */
  async connectWithRetry(retries = MAX_RETRIES): Promise<void> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        await this.$connect();
        this.isConnected = true;
        this.logger.log(`✅ Conectado ao banco de dados (tentativa ${attempt}/${retries})`);
        return;
      } catch (error) {
        lastError = error as Error;
        this.isConnected = false;

        if (attempt < retries) {
          const delay = Math.min(BASE_DELAY_MS * Math.pow(2, attempt - 1), MAX_DELAY_MS);
          this.logger.warn(
            `⚠️ Falha ao conectar ao banco (tentativa ${attempt}/${retries}). ` +
            `Tentando novamente em ${delay}ms... ${lastError.message}`,
          );
          await this.sleep(delay);
        }
      }
    }

    this.isConnected = false;
    this.logger.error(
      `❌ Falha ao conectar ao banco após ${retries} tentativas. Último erro: ${lastError!.message}`,
    );
    throw lastError!;
  }

  /**
   * Tenta reconectar ao banco se a conexão caiu.
   * Usa um mutex simples para evitar múltiplas reconexões concorrentes.
   */
  async ensureConnection(): Promise<void> {
    // Se já está conectado, faz um ping rápido
    if (this.isConnected) {
      try {
        await this.$queryRaw`SELECT 1`;
        return;
      } catch {
        this.logger.warn('⚠️ Conexão com banco perdida. Tentando reconectar...');
        this.isConnected = false;
      }
    }

    // Mutex: se outra requisição já está reconectando, aguarda
    if (this.connectLock) {
      this.logger.debug('Reconexão já em andamento por outra requisição. Aguardando...');
      // Aguarda até 15s pela reconexão concorrente
      for (let i = 0; i < 30; i++) {
        await this.sleep(500);
        if (this.isConnected) return;
      }
      // Se passou do tempo, tenta reconectar mesmo assim
      this.logger.warn('Timeout aguardando reconexão concorrente. Tentando própria reconexão...');
    }

    this.connectLock = true;
    try {
      // Garante que conexão anterior foi limpa
      try {
        await this.$disconnect();
      } catch {
        // Ignora erro ao desconectar — pode já estar desconectado
      }

      await this.connectWithRetry(3);
    } finally {
      this.connectLock = false;
    }
  }

  /**
   * Executa uma callback com verificação de conexão automática.
   * Se a query falhar por erro de conexão, tenta reconectar e executar novamente.
   */
  async withConnection<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      // Se for erro de conexão do Prisma/LibSQL, tenta reconectar e retentar
      if (this.isConnectionError(error)) {
        this.logger.warn(
          '⚠️ Erro de conexão detectado. Tentando reconectar e retentar operação...',
        );

        await this.ensureConnection();

        // Tenta novamente após reconexão
        try {
          return await operation();
        } catch (retryError) {
          this.logger.error(
            `❌ Operação falhou mesmo após reconexão: ${(retryError as Error).message}`,
          );
          throw retryError;
        }
      }

      // Se não for erro de conexão, propaga o erro original
      throw error;
    }
  }

  /**
   * Detecta se um erro é relacionado a falha de conexão.
   */
  private isConnectionError(error: unknown): boolean {
    const msg = (error as Error)?.message?.toLowerCase() || '';
    const prismaError = error as { code?: string };

    return (
      msg.includes('connection') ||
      msg.includes('timeout') ||
      msg.includes('etimedout') ||
      msg.includes('econnrefused') ||
      msg.includes('econnreset') ||
      msg.includes('socket') ||
      msg.includes('handshake') ||
      msg.includes('database is not connected') ||
      msg.includes('pool') ||
      msg.includes('closed') ||
      prismaError.code === 'P1001' || // Can't reach database
      prismaError.code === 'P1002' || // Timeout
      prismaError.code === 'P1008' || // Connection pool timeout
      prismaError.code === 'P1017' // Server closed connection
    );
  }

  /** Verifica se o banco está saudável (usado pelo health check) */
  async isHealthy(): Promise<boolean> {
    try {
      await this.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Retorna informações detalhadas da conexão com o banco.
   * Usado pelo endpoint de diagnóstico /api/debug/connections.
   */
  async getConnectionInfo(): Promise<{
    connected: boolean;
    latencyMs?: number;
    driver: string;
    databaseUrl: string;
    poolStatus?: string;
    error?: string;
  }> {
    const databaseUrl = process.env.DATABASE_URL || 'file:./dev.db';
    // Ofusca credenciais na URL para não expor senhas
    const sanitizedUrl = databaseUrl.replace(
      /\?authToken=([^&]+)/i,
      '?authToken=***',
    );

    const driver = databaseUrl.startsWith('libsql')
      ? 'Turso/LibSQL'
      : databaseUrl.startsWith('file')
        ? 'SQLite (local)'
        : databaseUrl.startsWith('postgresql')
          ? 'PostgreSQL'
          : 'Desconhecido';

    const start = Date.now();
    try {
      await this.$queryRaw`SELECT 1 as ping`;
      const latencyMs = Date.now() - start;

      return {
        connected: this.isConnected,
        latencyMs,
        driver,
        databaseUrl: sanitizedUrl,
        poolStatus: this.isConnected ? 'ativo' : 'reconectando',
      };
    } catch (error) {
      return {
        connected: false,
        latencyMs: Date.now() - start,
        driver,
        databaseUrl: sanitizedUrl,
        poolStatus: 'desconectado',
        error: (error as Error).message,
      };
    }
  }

  async onModuleInit() {
    await this.connectWithRetry();
  }

  async onModuleDestroy() {
    this.isConnected = false;
    await this.$disconnect();
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
