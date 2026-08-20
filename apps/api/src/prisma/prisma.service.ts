import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

const MAX_RETRIES = 5;
const BASE_DELAY_MS = 1000;
const MAX_DELAY_MS = 10_000;

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private logger!: Logger;
  private isConnected!: boolean;
  private connectLock!: boolean;

  constructor() {
    const url = process.env.DATABASE_URL;

    if (!url) {
      throw new Error(
        "DATABASE_URL não definida. Configure a variável de ambiente.",
      );
    }

    const isPostgres = url.startsWith("postgresql:") || url.startsWith("postgres:");

    if (isPostgres) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { PrismaPg } = require("@prisma/adapter-pg");
      const adapter = new PrismaPg({ connectionString: url });
      super({ adapter });
    } else {
      // SQLite local — usa adapter better-sqlite3
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");
      const dbPath = url.replace("file:", "");
      const adapter = new PrismaBetterSqlite3({ url: dbPath });
      super({ adapter });
    }

    this.logger = new Logger(PrismaService.name);
    this.isConnected = false;
    this.connectLock = false;
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
        this.logger.log(
          `✅ Conectado ao banco de dados (tentativa ${attempt}/${retries})`,
        );
        return;
      } catch (error) {
        lastError = error as Error;
        this.isConnected = false;

        if (attempt < retries) {
          const delay = Math.min(
            BASE_DELAY_MS * Math.pow(2, attempt - 1),
            MAX_DELAY_MS,
          );
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
    if (this.isConnected) {
      try {
        await this.$queryRaw`SELECT 1`;
        return;
      } catch {
        this.logger.warn(
          "⚠️ Conexão com banco perdida. Tentando reconectar...",
        );
        this.isConnected = false;
      }
    }

    if (this.connectLock) {
      this.logger.debug(
        "Reconexão já em andamento por outra requisição. Aguardando...",
      );
      for (let i = 0; i < 30; i++) {
        await this.sleep(500);
        if (this.isConnected) return;
      }
      this.logger.warn(
        "Timeout aguardando reconexão concorrente. Tentando própria reconexão...",
      );
    }

    this.connectLock = true;
    try {
      try {
        await this.$disconnect();
      } catch {
        // Ignora erro ao desconectar
      }

      await this.connectWithRetry(3);
    } finally {
      this.connectLock = false;
    }
  }

  /**
   * Executa uma callback com verificação de conexão automática.
   */
  async withConnection<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (this.isConnectionError(error)) {
        this.logger.warn(
          "⚠️ Erro de conexão detectado. Tentando reconectar e retentar operação...",
        );

        await this.ensureConnection();

        try {
          return await operation();
        } catch (retryError) {
          this.logger.error(
            `❌ Operação falhou mesmo após reconexão: ${(retryError as Error).message}`,
          );
          throw retryError;
        }
      }

      throw error;
    }
  }

  /**
   * Detecta se um erro é relacionado a falha de conexão.
   */
  private isConnectionError(error: unknown): boolean {
    const msg = (error as Error)?.message?.toLowerCase() || "";
    const prismaError = error as { code?: string };

    return (
      msg.includes("connection") ||
      msg.includes("timeout") ||
      msg.includes("etimedout") ||
      msg.includes("econnrefused") ||
      msg.includes("econnreset") ||
      msg.includes("socket") ||
      msg.includes("pool") ||
      msg.includes("closed") ||
      prismaError.code === "P1001" ||
      prismaError.code === "P1002" ||
      prismaError.code === "P1008" ||
      prismaError.code === "P1017"
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
   */
  async getConnectionInfo(): Promise<{
    connected: boolean;
    latencyMs?: number;
    driver: string;
    databaseUrl: string;
    poolStatus?: string;
    error?: string;
  }> {
    const databaseUrl = process.env.DATABASE_URL || "";
    const sanitizedUrl = databaseUrl.replace(
      /:[^:@]+@/,
      ":***@",
    );

    const driver = databaseUrl.startsWith("postgresql:") || databaseUrl.startsWith("postgres:")
      ? "PostgreSQL (Supabase)"
      : "SQLite (local)";

    const start = Date.now();
    try {
      await this.$queryRaw`SELECT 1 as ping`;
      const latencyMs = Date.now() - start;

      return {
        connected: this.isConnected,
        latencyMs,
        driver,
        databaseUrl: sanitizedUrl,
        poolStatus: this.isConnected ? "ativo" : "reconectando",
      };
    } catch (error) {
      return {
        connected: false,
        latencyMs: Date.now() - start,
        driver,
        databaseUrl: sanitizedUrl,
        poolStatus: "desconectado",
        error: (error as Error).message,
      };
    }
  }

  async onModuleInit() {
    await this.connectWithRetry();
  }

  /**
   * Chamado pelo NestJS ao receber sinais SIGTERM/SIGINT.
   */
  async onModuleDestroy() {
    this.logger.log("⏳ Desconectando Prisma...");
    this.isConnected = false;

    try {
      await this.$disconnect();
      this.logger.log("✅ Conexões do banco de dados encerradas com sucesso.");
    } catch (error) {
      this.logger.error(
        `⚠️ Erro ao encerrar conexões com o banco de dados: ${(error as Error).message}`,
      );
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
