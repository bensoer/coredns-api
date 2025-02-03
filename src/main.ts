import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { VersioningType } from '@nestjs/common';
import { HttpExceptionFilter } from './ex/http.exceptionfilter';
import helmet from 'helmet';
import { ConfigService } from '@nestjs/config';
import { EnvironmentUtils } from './utils/environmentutils';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api')
  app.enableVersioning({
    type: VersioningType.URI
  })
  app.useGlobalFilters(new HttpExceptionFilter())
  app.use(helmet())

  const configService = app.get(ConfigService)

  // if we are in the development node environment, give everything
  if (EnvironmentUtils.isDevelopmentEnvironment()) {
      app.useLogger(['error', 'log', 'warn', 'debug', 'verbose'])
      // if we are in a different environment but with ENABLE_DEBUG_LOGGING, give up to debug logging
  } else if (Boolean(configService.get('ENABLE_DEBUG_LOGGING'))) {
      app.useLogger(['error', 'warn', 'log', 'debug'])
      // otherwise we only output error, log and warnings
  } else {
      app.useLogger(['error', 'log', 'warn'])
  }

  const hasSSL = configService.get('USE_SSL') ? true : false

  const documentConfig = new DocumentBuilder()
      .setTitle('CoreDNS API')
      .setDescription(
          'API Docs For Managing CoreDNS Configurations via REST API',
      )
      .setVersion('1.0')
      .addServer(
          `http${hasSSL ? 's' : ''}://${configService.get(
              'HOST_NAME',
              'localhost',
          )}:${configService.get('SWAGGER_PORT', hasSSL ? 443 : 80)}`,
      )
      .build()
    const document = SwaggerModule.createDocument(app, documentConfig)
    SwaggerModule.setup('docs', app, document)

  await app.listen(configService.get('PORT', 3000));
}
bootstrap();
