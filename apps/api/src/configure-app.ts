import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { Express } from 'express';
import helmet from 'helmet';
import { config } from './config';

/** Shared by the local server (main.ts), the Vercel function (serverless.ts) and the e2e tests. */
export function configureApp(app: INestApplication, options: { swaggerUi: boolean }) {
  const server = app.getHttpAdapter().getInstance() as Express;
  // Vercel terminates TLS in front of the app; trust one proxy hop for client IPs.
  server.set('trust proxy', 1);
  server.disable('x-powered-by');

  app.setGlobalPrefix('api');
  // Swagger UI needs inline scripts, so relax the CSP in development only.
  app.use(helmet({ contentSecurityPolicy: config.isProd ? undefined : false }));
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));

  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle('Expense Flow API')
      .setDescription('Expense submission, approval and payment with an audit trail.')
      .setVersion('1.0')
      .addBearerAuth()
      .build(),
  );

  // The OpenAPI document is always available. The interactive UI is local-only: its static assets do
  // not bundle cleanly into a serverless function.
  server.get('/api/openapi.json', (_req, res) => {
    res.json(document);
  });
  if (options.swaggerUi) SwaggerModule.setup('api/docs', app, document);
}
