import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';

import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger();

  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
  });

  await app.listen(process.env.PORT || 3000, process.env.HOST || 'localhost');

  logger.log(
    `Application is running on http://${process.env.HOST || 'localhost'}:${
      process.env.PORT || 3000
    }`,
  );
}

bootstrap().catch((error) => {
  console.error('Failed to start the application:', error);
  process.exit(1);
});
