// Vercel entry. TypeORM loads its database driver dynamically, which the bundler's file tracer
// cannot see, so import it explicitly to make sure it ships with the function.
import 'pg';
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import type { IncomingMessage, ServerResponse } from 'node:http';
import express from 'express';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { configureApp } from './configure-app';

// Bootstrapped once per warm instance and reused across invocations.
let server: Promise<express.Express> | undefined;

function bootstrap() {
  server ??= (async () => {
    const instance = express();
    const app = await NestFactory.create(AppModule, new ExpressAdapter(instance), { bufferLogs: true });
    app.useLogger(app.get(Logger));
    configureApp(app, { swaggerUi: false });
    await app.init();
    return instance;
  })().catch((error) => {
    server = undefined; // allow the next invocation to retry
    throw error;
  });
  return server;
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const app = await bootstrap();
  app(req as express.Request, res as express.Response);
}
