import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Debug: Log environment variables
  console.log('🔍 Environment check:');
  console.log('  FRONTEND_URL (raw):', process.env.FRONTEND_URL);
  console.log('  NODE_ENV:', process.env.NODE_ENV);

  // CORS configuration - with fallback to prevent crashes
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';

  const allowedOrigins = [frontendUrl];

  // Allow both http and https versions
  if (frontendUrl.startsWith('http://')) {
    allowedOrigins.push(frontendUrl.replace('http://', 'https://'));
  } else if (frontendUrl.startsWith('https://')) {
    allowedOrigins.push(frontendUrl.replace('https://', 'http://'));
  }

  console.log('🔒 Configured CORS origins:', allowedOrigins);

  app.enableCors({
    origin: allowedOrigins,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Add Bull Dashboard for queue monitoring
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

  const port = process.env.PORT || 3000;
  const host = '0.0.0.0'; // <-- THIS IS THE KEY FIX
  await app.listen(port);
  console.log(`🚀 Backend running on http://${host}:${port}`);
  console.log(`🔒 CORS enabled for: ${allowedOrigins.join(', ')}`);
}
bootstrap();
