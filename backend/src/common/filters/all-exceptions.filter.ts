import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { BusinessException } from '../exceptions/business.exception';
import { ErrorCodes } from '../constants/error-codes';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Lỗi hệ thống, vui lòng thử lại sau';
    let errorCode: string = ErrorCodes.INTERNAL_SERVER_ERROR;
    let details: unknown;

    if (exception instanceof BusinessException) {
      statusCode = exception.getStatus();
      const body = exception.getResponse() as {
        message: string;
        errorCode: string;
        details?: Record<string, unknown>;
      };
      message = body.message;
      errorCode = body.errorCode;
      details = body.details;
    } else if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const body = exception.getResponse();
      if (typeof body === 'string') {
        message = body;
      } else if (typeof body === 'object' && body !== null) {
        const obj = body as Record<string, unknown>;
        message = (obj.message as string) || message;
        if (Array.isArray(obj.message)) {
          message = (obj.message as string[]).join(', ');
          errorCode = ErrorCodes.VALIDATION_ERROR;
          details = obj.message;
        }
      }
      if (statusCode === HttpStatus.UNAUTHORIZED) errorCode = ErrorCodes.UNAUTHORIZED;
      if (statusCode === HttpStatus.FORBIDDEN) errorCode = ErrorCodes.FORBIDDEN;
      if (statusCode === HttpStatus.NOT_FOUND) errorCode = ErrorCodes.NOT_FOUND;
      if (statusCode === HttpStatus.CONFLICT) errorCode = ErrorCodes.CONFLICT;
    } else {
      this.logger.error('Unhandled exception', exception);
    }

    response.status(statusCode).json({
      success: false,
      statusCode,
      message,
      error: { code: errorCode, details },
    });
  }
}
