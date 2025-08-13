import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  //Add Bull Dashboard for queue monitoring
  if (process.env.NODE_ENV === 'development') {
    const { Queue } = await import('bullmq');
    const monitorQueue = new Queue('monitor-checks', {
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
      },
    });

    const serverAdapter = new ExpressAdapter();
    serverAdapter.setBasePath('/admin/queues');

    createBullBoard({
      queues: [new BullMQAdapter(monitorQueue)],
      serverAdapter,
    });
    app.use('/admin/queues', serverAdapter.getRouter());
    console.log(
      '🎯 Bull Dashboard available at: http://localhost:3000/admin/queues',
    );
  }
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
