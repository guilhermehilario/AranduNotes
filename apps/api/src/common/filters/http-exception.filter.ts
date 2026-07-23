import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Códigos de erro conhecidos do Prisma:
 * P1001 - Não foi possível conectar ao banco
 * P1002 - Timeout na conexão
 * P1008 - Timeout no pool de conexões
 * P1017 - Servidor fechou a conexão
 * P2002 - Violação de unique constraint
 * P2025 - Registro não encontrado
 */
const PRISMA_CONNECTION_CODES = ['P1001', 'P1002', 'P1008', 'P1017'];

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Ocorreu um erro interno no servidor';
    let error = 'Internal Server Error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const resp = exceptionResponse as Record<string, unknown>;
        message = (resp.message as string) || exception.message;
        error = (resp.error as string) || error;
      }
    } else if (exception instanceof Error) {
      // ── Erros do Prisma ──
      const prismaErr = exception as { code?: string; meta?: Record<string, unknown> };

      if (prismaErr.code && PRISMA_CONNECTION_CODES.includes(prismaErr.code)) {
        status = HttpStatus.SERVICE_UNAVAILABLE;
        message =
          'O banco de dados está temporariamente indisponível. ' +
          'O servidor pode estar inicializando. Tente novamente em alguns instantes.';
        error = 'Database Unavailable';
        this.logger.error(
          `[PRISMA CONNECTION ERROR] Code: ${prismaErr.code} - ${exception.message}`,
        );
      } else if (exception.name === 'PrismaClientKnownRequestError') {
        // Outros erros conhecidos do Prisma (ex: unique constraint)
        status = HttpStatus.BAD_REQUEST;
        message = 'Erro ao processar a requisição no banco de dados.';
        error = 'Database Error';
        this.logger.error(
          `[PRISMA ERROR] Code: ${prismaErr.code} - ${exception.message}`,
        );
      } else {
        // ── Erros genéricos não tratados ──
        this.logger.error(
          `[ERRO NÃO TRATADO] ${exception.stack || exception.message}`,
        );
      }
    }

    // Erros conhecidos do Express
    const expressErr = exception as Record<string, unknown>;
    if (expressErr.type === 'entity.parse.failed') {
      status = 400;
      message = 'JSON inválido no corpo da requisição';
      error = 'Bad Request';
    } else if (expressErr.type === 'entity.too.large') {
      status = 413;
      message = 'Payload muito grande';
      error = 'Payload Too Large';
    }

    response.status(status).json({
      statusCode: status,
      message,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
