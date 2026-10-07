import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { AuthUser } from '../common/roles';
import { User } from './user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly jwt: JwtService,
  ) {}

  async register(email: string, password: string) {
    const normalized = email.toLowerCase();
    if (await this.users.findOneBy({ email: normalized })) {
      throw new ConflictException('Email already registered');
    }
    const user = await this.users.save(
      this.users.create({ email: normalized, passwordHash: await bcrypt.hash(password, 10), role: 'employee' }),
    );
    return this.session(user);
  }

  async login(email: string, password: string) {
    const user = await this.users.findOneBy({ email: email.toLowerCase() });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.session(user);
  }

  private session(user: User) {
    const payload: AuthUser = { id: user.id, email: user.email, role: user.role };
    return { token: this.jwt.sign(payload), user: payload };
  }
}
