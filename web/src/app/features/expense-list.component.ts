import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { ExpenseStore } from '../core/expense.store';
import { Expense, Status } from '../core/models';

@Component({
  selector: 'app-expense-list',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, CurrencyPipe, DatePipe],
  template: `
    <div class="toolbar">
      <select [value]="store.status()" (change)="store.setStatus($any($event.target).value)">
        <option value="">All statuses</option>
        @for (s of statuses; track s) {
          <option [value]="s">{{ s }}</option>
        }
      </select>
      <a routerLink="/expenses/new" class="button">New expense</a>
    </div>

    @if (store.error()) {
      <p class="error">{{ store.error() }}</p>
    }

    <table>
      <thead>
        <tr>
          <th>Title</th><th>Amount</th><th>Category</th><th>Status</th><th>Submitted by</th><th>Date</th><th></th>
        </tr>
      </thead>
      <tbody>
        @for (e of store.items(); track e.id) {
          <tr>
            <td>{{ e.title }}</td>
            <td>{{ e.amount / 100 | currency: 'EUR' }}</td>
            <td>{{ e.category }}</td>
            <td><span [class]="'badge ' + e.status">{{ e.status }}</span></td>
            <td>{{ e.submitterEmail }}</td>
            <td>{{ e.createdAt | date: 'mediumDate' }}</td>
            <td class="actions">
              @if (canReview(e)) {
                <button (click)="store.review(e.id, 'approve')">Approve</button>
                <button class="secondary" (click)="startReject(e.id)">Reject</button>
              }
              @if (canPay(e)) {
                <button (click)="store.review(e.id, 'pay')">Mark paid</button>
              }
            </td>
          </tr>
          @if (rejectingId() === e.id) {
            <tr>
              <td colspan="7">
                <input placeholder="Reason for rejection" [formControl]="reason" />
                <button (click)="confirmReject(e.id)" [disabled]="reason.invalid">Confirm</button>
                <button class="secondary" (click)="rejectingId.set(null)">Cancel</button>
              </td>
            </tr>
          }
          @if (e.status === 'rejected' && e.rejectionReason) {
            <tr><td colspan="7" class="hint">Rejected: {{ e.rejectionReason }}</td></tr>
          }
        } @empty {
          <tr><td colspan="7">{{ store.loading() ? 'Loading…' : 'No expenses found.' }}</td></tr>
        }
      </tbody>
    </table>

    <div class="pager">
      <button (click)="store.setPage(store.page() - 1)" [disabled]="store.page() <= 1">Prev</button>
      <span>Page {{ store.page() }} of {{ store.pages() }} ({{ store.total() }} expenses)</span>
      <button (click)="store.setPage(store.page() + 1)" [disabled]="store.page() >= store.pages()">Next</button>
    </div>
  `,
})
export class ExpenseListComponent {
  readonly store = inject(ExpenseStore);
  private readonly auth = inject(AuthService);

  readonly statuses: Status[] = ['pending', 'approved', 'rejected', 'paid'];
  readonly rejectingId = signal<number | null>(null);
  readonly reason = new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(3)] });

  constructor() {
    this.store.load();
  }

  canReview(e: Expense) {
    return this.auth.hasRole('manager') && e.status === 'pending' && e.submittedBy !== this.auth.user()?.id;
  }

  canPay(e: Expense) {
    return this.auth.hasRole('finance') && e.status === 'approved' && e.submittedBy !== this.auth.user()?.id;
  }

  startReject(id: number) {
    this.reason.reset();
    this.rejectingId.set(id);
  }

  confirmReject(id: number) {
    this.store.review(id, 'reject', this.reason.value);
    this.rejectingId.set(null);
  }
}
