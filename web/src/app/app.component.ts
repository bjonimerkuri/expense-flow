import { Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from './core/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink],
  template: `
    <header class="nav">
      <a routerLink="/"><b>Expense Flow</b></a>
      @if (auth.user(); as user) {
        <a routerLink="/">Expenses</a>
        <a routerLink="/expenses/new">New expense</a>
        @if (auth.hasRole('manager', 'finance')) {
          <a routerLink="/dashboard">Dashboard</a>
        }
        <span class="spacer">{{ user.email }} ({{ user.role }})</span>
        <button (click)="auth.logout()">Log out</button>
      }
    </header>
    <main><router-outlet /></main>
  `,
})
export class AppComponent {
  readonly auth = inject(AuthService);
}
