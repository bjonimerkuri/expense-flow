import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { errorMessage } from '../core/errors';
import { ExpenseApi } from '../core/expense.api';
import { ExpenseStore } from '../core/expense.store';
import { Category } from '../core/models';

@Component({
  selector: 'app-expense-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <a routerLink="/">Back to expenses</a>
    <h2>New expense</h2>
    <form class="stack" [formGroup]="form" (ngSubmit)="submit()">
      <input placeholder="Title" formControlName="title" />
      <input type="number" step="0.01" placeholder="Amount in EUR" formControlName="amount" />
      <select formControlName="category">
        @for (c of categories; track c) {
          <option [value]="c">{{ c }}</option>
        }
      </select>
      <textarea placeholder="Description (optional)" formControlName="description"></textarea>
      @if (error()) {
        <p class="error">{{ error() }}</p>
      }
      <button type="submit" [disabled]="form.invalid || saving()">Submit for approval</button>
    </form>
  `,
})
export class ExpenseFormComponent {
  private readonly api = inject(ExpenseApi);
  private readonly store = inject(ExpenseStore);
  private readonly router = inject(Router);

  readonly categories: Category[] = ['travel', 'meals', 'software', 'equipment', 'other'];
  readonly error = signal('');
  readonly saving = signal(false);

  readonly form = new FormGroup({
    title: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(3)] }),
    amount: new FormControl<number | null>(null, { validators: [Validators.required, Validators.min(0.01)] }),
    category: new FormControl<Category>('other', { nonNullable: true }),
    description: new FormControl('', { nonNullable: true }),
  });

  submit() {
    const { title, amount, category, description } = this.form.getRawValue();
    this.saving.set(true);
    this.error.set('');
    this.api
      .create({
        title,
        category,
        amount: Math.round((amount ?? 0) * 100),
        description: description || undefined,
      })
      .subscribe({
        next: () => {
          this.store.load();
          this.router.navigateByUrl('/');
        },
        error: (e) => {
          this.error.set(errorMessage(e));
          this.saving.set(false);
        },
      });
  }
}
