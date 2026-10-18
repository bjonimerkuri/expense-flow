import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './core/auth.service';
import { ROLE_LABEL } from './core/labels';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <a class="skip" href="#main">Skip to content</a>
    @if (auth.user(); as user) {
      <div class="shell">
        <aside class="sidebar">
          <a class="brand" routerLink="/" aria-label="Expense Flow home">
            <svg width="26" height="26" viewBox="0 0 32 32" aria-hidden="true">
              <rect width="32" height="32" rx="7" fill="#ffffff" />
              <path d="M10 9h12v3H10zm0 5.5h12v3H10zM10 20h8v3h-8z" fill="#26245f" />
            </svg>
            Expense Flow
          </a>
          <nav class="nav" aria-label="Main">
            <a routerLink="/" routerLinkActive ariaCurrentWhenActive="page" [routerLinkActiveOptions]="{ exact: true }">
              Expenses
            </a>
            <a routerLink="/expenses/new" routerLinkActive ariaCurrentWhenActive="page">New expense</a>
            @if (auth.hasRole('manager', 'finance')) {
              <a routerLink="/dashboard" routerLinkActive ariaCurrentWhenActive="page">Dashboard</a>
            }
          </nav>
          <div class="who">
            <span>
              <strong>{{ user.email }}</strong>
              {{ roleLabel[user.role] }}
            </span>
            <button type="button" class="small" (click)="auth.logout()">Log out</button>
          </div>
        </aside>
        <main id="main" tabindex="-1" class="content"><router-outlet /></main>
      </div>
    } @else {
      <main id="main" tabindex="-1" class="content-bare"><router-outlet /></main>
    }
  `,
})
export class AppComponent {
  readonly auth = inject(AuthService);
  readonly roleLabel = ROLE_LABEL;
}
