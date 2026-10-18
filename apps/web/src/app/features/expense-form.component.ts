import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { errorMessage } from '../core/errors';
import { ExpenseApi } from '../core/expense.api';
import { ExpenseStore } from '../core/expense.store';
import { CATEGORY_LABEL } from '../core/labels';
import { Category } from '../core/models';

@Component({
  selector: 'app-expense-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <a class="back" routerLink="/">Back to expenses</a>
    <div class="page-head"><h1>New expense</h1></div>
    <form class="stack form-narrow" [formGroup]="form" (ngSubmit)="submit()" novalidate>
      <label>
        Title
        <input formControlName="title" [attr.aria-invalid]="invalid('title')" />
        @if (invalid('title')) {
          <span class="field-error">Enter a title of at least 3 characters.</span>
        }
      </label>
      <label>
        Amount (EUR)
        <span class="amount-field">
          <span aria-hidden="true">€</span>
          <input
            type="number"
            step="0.01"
            min="0.01"
            inputmode="decimal"
            formControlName="amount"
            [attr.aria-invalid]="invalid('amount')"
          />
        </span>
        @if (invalid('amount')) {
          <span class="field-error">Enter an amount greater than zero.</span>
        }
      </label>
      <label>
        Category
        <select formControlName="category">
          @for (c of categories; track c) {
            <option [value]="c">{{ categoryLabel[c] }}</option>
          }
        </select>
      </label>
      <label>
        Description
        <textarea formControlName="description"></textarea>
        <span class="field-hint">Optional. Add context a reviewer might need.</span>
      </label>
      <div aria-live="polite">
        @if (error()) {
          <p class="error" role="alert">{{ error() }}</p>
        }
      </div>
      <div class="form-actions">
        <button type="submit" [disabled]="saving()">Submit for approval</button>
        <a class="btn btn-quiet" routerLink="/">Cancel</a>
      </div>
    </form>
  `,
})
export class ExpenseFormComponent {
  private readonly api = inject(ExpenseApi);
  private readonly store = inject(ExpenseStore);
  private readonly router = inject(Router);

  readonly categories: Category[] = ['travel', 'meals', 'software', 'equipment', 'other'];
  readonly categoryLabel = CATEGORY_LABEL;
  readonly error = signal('');
  readonly saving = signal(false);
  private readonly submitted = signal(false);

  readonly form = new FormGroup({
    title: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(3)] }),
    amount: new FormControl<number | null>(null, { validators: [Validators.required, Validators.min(0.01)] }),
    category: new FormControl<Category>('other', { nonNullable: true }),
    description: new FormControl('', { nonNullable: true }),
  });

  invalid(name: 'title' | 'amount'): boolean {
    const control = this.form.controls[name];
    return control.invalid && (control.touched || this.submitted());
  }

  submit() {
    this.submitted.set(true);
    if (this.form.invalid) return;
    const { title, amount, category, description } = this.form.getRawValue();
    this.saving.set(true);
    this.error.set('');
    this.api
      .create({
        title,
        category,
        // Money travels as integer cents. Round via 2 decimals to avoid float artefacts (1.005 * 100).
        amount: Math.round(parseFloat((amount ?? 0).toFixed(2)) * 100),
        description: description.trim() || undefined,
      })
      .subscribe({
        next: () => {
          this.store.load();
          void this.router.navigateByUrl('/');
        },
        error: (e) => {
          this.error.set(errorMessage(e));
          this.saving.set(false);
        },
      });
  }
}
