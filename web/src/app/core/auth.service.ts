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

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly current = signal<User | null>(this.read());

  readonly user = this.current.asReadonly();

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
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.current.set(null);
    this.router.navigateByUrl('/login');
  }

  private store(session: Session) {
    localStorage.setItem('token', session.token);
    localStorage.setItem('user', JSON.stringify(session.user));
    this.current.set(session.user);
  }

  private read(): User | null {
    const raw = localStorage.getItem('user');
    return raw ? (JSON.parse(raw) as User) : null;
  }
}
