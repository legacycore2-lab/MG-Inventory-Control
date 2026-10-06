import 'reflect-metadata';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  const origins = process.env.CORS_ORIGIN?.split(',').map((s) => s.trim());
  app.enableCors({ origin: origins && origins.length ? origins : true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  const port = +(process.env.PORT || 3000);
  await app.listen(port, '0.0.0.0');
  new Logger('Bootstrap').log(`API جاهز على http://localhost:${port}/api`);
}
bootstrap();
