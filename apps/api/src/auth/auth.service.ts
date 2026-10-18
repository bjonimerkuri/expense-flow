import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { AuthUser } from '../common/roles';
import { User } from './user.entity';

// Compared against when the email is unknown, so response time does not reveal which emails exist.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 10);

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly jwt: JwtService,
  ) {}

  async register(email: string, password: string) {
    if (await this.users.findOneBy({ email })) throw new ConflictException('Email already registered');
    try {
      const user = await this.users.save(
        this.users.create({ email, passwordHash: await bcrypt.hash(password, 10), role: 'employee' }),
      );
      return this.session(user);
    } catch (e) {
      // Two concurrent registrations can both pass the check above; the unique index decides.
      if ((e as { code?: string }).code === '23505') throw new ConflictException('Email already registered');
      throw e;
    }
  }

  async login(email: string, password: string) {
    const user = await this.users.findOneBy({ email });
    const valid = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
    if (!user || !valid) throw new UnauthorizedException('Invalid credentials');
    return this.session(user);
  }

  private session(user: User) {
    const payload: AuthUser = { id: user.id, email: user.email, role: user.role };
    return { token: this.jwt.sign(payload), user: payload };
  }
}
