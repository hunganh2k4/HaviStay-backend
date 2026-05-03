import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Initialize cookie parser
  app.use(cookieParser());

  // Increase payload size limit (fix 413 Payload Too Large)
  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ limit: '20mb', extended: true }));

  const allowedOrigins = (
    process.env.FRONTEND_URL || ''
  )
    .split(',')
    .map((origin) => origin.trim());

  app.enableCors({
    origin: (origin, callback) => {
      // Postman / server-to-server / same-origin
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked for origin: ${origin}`), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });


  await app.listen(process.env.PORT ?? 5000);
}
bootstrap();
