import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { API_URL } from './config';
import { Role, User } from './models';

interface Session {
  token: string;
  user: User;
}

const TOKEN_KEY = 'expense-flow.token';
const USER_KEY = 'expense-flow.user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly current = signal<User | null>(this.read());

  readonly user = this.current.asReadonly();

  token(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  login(email: string, password: string) {
    return this.http.post<Session>(`${API_URL}/auth/login`, { email, password }).pipe(tap((s) => this.store(s)));
  }

  register(email: string, password: string) {
    return this.http.post<Session>(`${API_URL}/auth/register`, { email, password }).pipe(tap((s) => this.store(s)));
  }

  hasRole(...roles: Role[]) {
    const user = this.current();
    return user !== null && roles.includes(user.role);
  }

  logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.current.set(null);
    void this.router.navigateByUrl('/login');
  }

  private store(session: Session) {
    localStorage.setItem(TOKEN_KEY, session.token);
    localStorage.setItem(USER_KEY, JSON.stringify(session.user));
    this.current.set(session.user);
  }

  private read(): User | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw && localStorage.getItem(TOKEN_KEY) ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  }
}
