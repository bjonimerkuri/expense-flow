import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import { LoggerModule } from 'nestjs-pino';
import { AuthModule } from './auth/auth.module';
import { config } from './config';
import { dataSourceOptions } from './data-source';
import { ExpensesModule } from './expenses/expenses.module';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        level: config.logLevel,
        redact: ['req.headers.authorization', 'req.headers.cookie'],
        genReqId: (req, res) => {
          const id = (req.headers['x-request-id'] as string) ?? randomUUID();
          res.setHeader('x-request-id', id);
          return id;
        },
      },
    }),
    TypeOrmModule.forRoot(dataSourceOptions),
    JwtModule.register({
      global: true,
      secret: config.jwtSecret,
      signOptions: { algorithm: 'HS256', expiresIn: '8h' },
    }),
    // A generous default for the whole API. Credential endpoints tighten it with @Throttle. The in-memory
    // store is per instance, which is a known limitation on serverless (see docs/adr/0004).
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60 * 1000, limit: 300 }],
      skipIf: () => config.isTest,
    }),
    AuthModule,
    ExpensesModule,
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
