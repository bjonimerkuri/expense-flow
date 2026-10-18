import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CredentialsDto } from './auth.dto';
import { AuthService } from './auth.service';

@ApiTags('auth')
@Controller('auth')
// Credential endpoints: 30 attempts per 15 minutes per client IP.
@Throttle({ default: { ttl: 15 * 60 * 1000, limit: 30 } })
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  register(@Body() dto: CredentialsDto) {
    return this.auth.register(dto.email, dto.password);
  }

  @Post('login')
  login(@Body() dto: CredentialsDto) {
    return this.auth.login(dto.email, dto.password);
  }
}
