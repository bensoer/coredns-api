import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { VersioningType } from '@nestjs/common';
import { HttpExceptionFilter } from './ex/http.exceptionfilter';
import helmet from 'helmet';
import { ConfigService } from '@nestjs/config';
import { EnvironmentUtils } from './utils/environmentutils';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as fsp from 'fs/promises'
import * as fs from 'fs'
import { Constants } from './utils/constants';

async function bootstrap() {

  // 1) Create and configure Nest app
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api')
  app.enableVersioning({
    type: VersioningType.URI
  })
  app.useGlobalFilters(new HttpExceptionFilter())
  app.use(helmet())

  // 2) Get configuration data
  const configService = app.get(ConfigService)

  // 3) Configure Logging Based On Environment
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

  // 4) Determine if were server with HTTP or HTTPS
  const hasSSL = configService.get('USE_SSL') ? true : false

  // 5) Configure OpenAPI / Swagger Documentation
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

  // 6) Verify core configuration files are setup

  const coreFileCheck = async () => {
    try{
      await fsp.access(`${Constants.COREDNS_CONFIG_ROOT}/Corefile`, fsp.constants.F_OK)
    }catch(err){
      const corefileData = `import ./Corefile.d/*`
      await fsp.writeFile(`${Constants.COREDNS_CONFIG_ROOT}/Corefile`, corefileData)
    }
  }

  const zoneFolderCheck = async() => {
    try{
      await fsp.access(`${Constants.COREDNS_CONFIG_ROOT}/zones`, fsp.constants.F_OK)
    }catch(err){
      await fsp.mkdir(`${Constants.COREDNS_CONFIG_ROOT}/zones`, { recursive: true})
    }
  }

  const coreFileDCheck = async () => {
    try{
      await fsp.access(`${Constants.COREDNS_CONFIG_ROOT}/Corefile.d/Corefile`, fsp.constants.F_OK)
    }catch(err){
      const defaultDnsForwardAddresses = "8.8.8.8 8.8.4.4"
      let dnsForwardAddresses = configService.get("DNS_FORWARD_ADDRESSES", defaultDnsForwardAddresses)
      const components = dnsForwardAddresses.split(" ")

      const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
      for(const possibleIP of components){
        if(!ipv4Pattern.test(possibleIP)){
          dnsForwardAddresses = defaultDnsForwardAddresses
          break
        }
      }

      const corefileData = `.:53 {
    forward . ${dnsForwardAddresses}
    log
    errors
    health :8080
    reload
}`

      await fsp.mkdir(`${Constants.COREDNS_CONFIG_ROOT}/Corefile.d`, { recursive: true})
      await fsp.writeFile(`${Constants.COREDNS_CONFIG_ROOT}/Corefile.d/Corefile`, corefileData)
    }
  }

  await Promise.all([
    coreFileCheck(),
    zoneFolderCheck(),
    coreFileDCheck()
  ])
  
  // 7) Start up the actual server
  await app.listen(configService.get('PORT', 3000));
}
bootstrap();
