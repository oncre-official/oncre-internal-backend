import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { json, urlencoded } from 'express';

import { AppModule } from './app.module';
import { config } from './config';

import type { NestExpressApplication } from '@nestjs/platform-express';

const isProd = config.app.isProd;
const port = Number(config.port ?? 3000);
const swaggerUrl = isProd ? 'docs/on-recovery' : 'doc';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    cors: true,
    rawBody: true,
  });

  app.use(json({ limit: '100mb' }));
  app.use(urlencoded({ limit: '50mb', extended: true }));

  app.set('trust proxy', true);

  app.useGlobalPipes(new ValidationPipe({}));

  const swaggerConfig = new DocumentBuilder()
    .setTitle('OnCre Recovery API Documentation')
    .setDescription('OnCre Recovery V1 API Documentation')
    .setVersion('2.0')
    .addTag('On-Cre Recovery API')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(swaggerUrl, app, document);

  await app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
}

void bootstrap();
