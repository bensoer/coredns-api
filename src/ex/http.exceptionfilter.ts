import {
  ArgumentsHost,
  ExceptionFilter,
  HttpException,
  Catch,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { EnvironmentUtils } from 'src/utils/environmentutils';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const logger = new Logger(HttpExceptionFilter.name);

    logger.log('Global Exception Caught');

    const payload: Record<string, any> = {
      route: request.url,
      httpStatusCode: status,
      message: 'An unknown server error has occurred',
    };

    switch (status) {
      case 400:
      case 409:
        payload.message = 'Invalid Request';
        break;
      case 404:
        payload.message = 'Resource could not be found';
        break;
      case 403:
      case 401:
        payload.message = 'Resource access not permitted';
        break;
    }

    logger.error(
      `${status} - ${exception.name} - ${request.method}:${request.originalUrl}`,
    );
    logger.debug(JSON.stringify(exception.getResponse()));

    // only in the dev environment do we add the exception data to the payload
    if (EnvironmentUtils.isDevelopmentEnvironment()) {
      payload.exception = exception.getResponse();
    }

    response.status(status).json(payload);
  }
}
