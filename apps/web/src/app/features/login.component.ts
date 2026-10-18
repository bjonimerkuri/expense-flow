import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { errorMessage } from '../core/errors';

const DEMO_PASSWORD = 'password123';
const DEMOS = [
  { label: 'Employee', email: 'employee@example.com' },
  { label: 'Manager', email: 'manager@example.com' },
  { label: 'Finance', email: 'finance@example.com' },
];

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="signin">
      <div>
        <h1>Expense Flow</h1>
        <p class="muted">Submit expenses, get them approved, and see them paid. Every change is recorded.</p>
      </div>
      <form class="panel form-card" [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <h2>{{ mode() === 'login' ? 'Sign in' : 'Create an account' }}</h2>
        <label>
          Email
          <input type="email" autocomplete="email" formControlName="email" />
        </label>
        <label>
          Password
          <input
            type="password"
            [autocomplete]="mode() === 'login' ? 'current-password' : 'new-password'"
            formControlName="password"
          />
          @if (mode() === 'register') {
            <span class="field-hint">At least 8 characters.</span>
          }
        </label>
        <div aria-live="polite">
          @if (error()) {
            <p class="error" role="alert">{{ error() }}</p>
          }
        </div>
        <button type="submit" [disabled]="loading()">{{ mode() === 'login' ? 'Sign in' : 'Create account' }}</button>
        <button type="button" class="link" (click)="toggle()">
          {{ mode() === 'login' ? 'No account yet? Create one' : 'Already registered? Sign in' }}
        </button>
      </form>
      <div class="demo">
        <h2>Try a demo account</h2>
        <p class="muted small">Fills in the form. The password for all three is {{ demoPassword }}.</p>
        <div class="demo-row">
          @for (d of demos; track d.email) {
            <button type="button" class="quiet" (click)="fill(d.email)">{{ d.label }}</button>
          }
        </div>
      </div>
    </div>
  `,
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly demos = DEMOS;
  readonly demoPassword = DEMO_PASSWORD;
  readonly mode = signal<'login' | 'register'>('login');
  readonly error = signal('');
  readonly loading = signal(false);

  readonly form = new FormGroup({
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(8)] }),
  });

  fill(email: string) {
    this.form.setValue({ email, password: DEMO_PASSWORD });
    this.error.set('');
  }

  toggle() {
    this.mode.update((m) => (m === 'login' ? 'register' : 'login'));
    this.error.set('');
  }

  submit() {
    if (this.form.invalid) {
      this.error.set('Enter a valid email and a password of at least 8 characters.');
      return;
    }
    const { email, password } = this.form.getRawValue();
    this.loading.set(true);
    this.error.set('');
    const request = this.mode() === 'login' ? this.auth.login(email, password) : this.auth.register(email, password);
    request.subscribe({
      next: () => void this.router.navigateByUrl('/'),
      error: (e) => {
        this.error.set(errorMessage(e));
        this.loading.set(false);
      },
    });
  }
}
