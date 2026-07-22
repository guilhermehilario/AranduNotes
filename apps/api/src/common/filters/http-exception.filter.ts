import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
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
      console.error('[ERRO NÃO TRATADO]', exception.stack || exception.message);
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
