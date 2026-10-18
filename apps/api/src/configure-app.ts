import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { Express } from 'express';
import helmet from 'helmet';
import { config } from './config';

/** Shared by the local server (main.ts), the Vercel function (serverless.ts) and the e2e tests. */
export function configureApp(app: INestApplication, options: { swaggerUi: boolean }) {
  // Vercel terminates TLS in front of the app; trust one proxy hop for client IPs.
  (app.getHttpAdapter().getInstance() as Express).set('trust proxy', 1);
  (app.getHttpAdapter().getInstance() as Express).disable('x-powered-by');

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
  // /api/openapi.json is always available. The interactive UI is local-only: its static assets do not
  // bundle cleanly into a serverless function.
  SwaggerModule.setup('docs', app, document, {
    useGlobalPrefix: true,
    jsonDocumentUrl: 'openapi.json',
    ui: options.swaggerUi,
  });
}
