import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ExpenseStore } from '../core/expense.store';
import { CATEGORY_LABEL, STATUS_LABEL } from '../core/labels';
import { Expense, Status } from '../core/models';
import { StatusBadgeComponent } from '../shared/badge.component';

@Component({
  selector: 'app-expense-list',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, CurrencyPipe, DatePipe, StatusBadgeComponent],
  template: `
    <div class="page-head">
      <h1>Expenses</h1>
      <a routerLink="/expenses/new" class="btn">New expense</a>
    </div>

    <div class="filters">
      <label>
        Status
        <select #statusSelect [value]="store.status()" (change)="store.setStatus(statusSelect.value)">
          <option value="">All statuses</option>
          @for (s of statuses; track s) {
            <option [value]="s">{{ statusLabel[s] }}</option>
          }
        </select>
      </label>
    </div>

    <div aria-live="polite">
      @if (store.error()) {
        <p class="error" role="alert">{{ store.error() }}</p>
      }
    </div>

    <div class="panel" [attr.aria-busy]="store.loading()">
      @if (store.items().length) {
        <div class="table-wrap">
          <table>
            <caption class="visually-hidden">
              Expenses, newest first
            </caption>
            <thead>
              <tr>
                <th scope="col">Title</th>
                <th scope="col">Category</th>
                <th scope="col">Status</th>
                <th scope="col">Submitted by</th>
                <th scope="col">Date</th>
                <th scope="col" class="money">Amount</th>
                <th scope="col"><span class="visually-hidden">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              @for (e of store.items(); track e.id) {
                <tr>
                  <td>
                    <a class="row-title" [routerLink]="['/expenses', e.id]">{{ e.title }}</a>
                  </td>
                  <td>{{ categoryLabel[e.category] }}</td>
                  <td><app-status [value]="e.status" /></td>
                  <td>{{ e.submitterEmail }}</td>
                  <td>{{ e.createdAt | date: 'mediumDate' }}</td>
                  <td class="money">{{ e.amount / 100 | currency: 'EUR' }}</td>
                  <td>
                    <div class="actions">
                      @if (e.actions.includes('approve')) {
                        <button type="button" class="small" (click)="store.review(e.id, 'approve')">
                          Approve<span class="visually-hidden"> {{ e.title }}</span>
                        </button>
                      }
                      @if (e.actions.includes('reject')) {
                        <button type="button" class="small danger" (click)="startReject(e.id)">
                          Reject<span class="visually-hidden"> {{ e.title }}</span>
                        </button>
                      }
                      @if (e.actions.includes('pay')) {
                        <button type="button" class="small" (click)="store.review(e.id, 'pay')">
                          Mark paid<span class="visually-hidden"> {{ e.title }}</span>
                        </button>
                      }
                    </div>
                  </td>
                </tr>
                @if (rejectingId() === e.id) {
                  <tr class="reject-row">
                    <td colspan="7">
                      <form class="reject-form" (submit)="confirmReject($event, e)">
                        <label>
                          Reason for rejecting “{{ e.title }}”
                          <input [formControl]="reason" autocomplete="off" />
                        </label>
                        <button type="submit" class="danger" [disabled]="reason.invalid">Reject expense</button>
                        <button type="button" class="quiet" (click)="rejectingId.set(null)">Cancel</button>
                      </form>
                    </td>
                  </tr>
                }
                @if (e.status === 'rejected' && e.rejectionReason) {
                  <tr class="note-row">
                    <td colspan="7">Rejected: {{ e.rejectionReason }}</td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>
        <div class="pager">
          <span>Page {{ store.page() }} of {{ store.pages() }} · {{ store.total() }} expenses</span>
          <span class="buttons">
            <button type="button" class="quiet" (click)="store.setPage(store.page() - 1)" [disabled]="store.page() <= 1">
              Previous
            </button>
            <button
              type="button"
              class="quiet"
              (click)="store.setPage(store.page() + 1)"
              [disabled]="store.page() >= store.pages()"
            >
              Next
            </button>
          </span>
        </div>
      } @else if (store.loading()) {
        <p class="empty muted" role="status">Loading expenses…</p>
      } @else {
        <div class="empty">
          <h2>{{ store.status() ? 'No expenses with this status' : 'No expenses yet' }}</h2>
          <p>
            {{
              store.status()
                ? 'Choose a different status to see more.'
                : 'Submit an expense and a manager will review it.'
            }}
          </p>
          @if (!store.status()) {
            <a routerLink="/expenses/new" class="btn">Submit your first expense</a>
          }
        </div>
      }
    </div>
  `,
})
export class ExpenseListComponent {
  readonly store = inject(ExpenseStore);

  readonly statuses: Status[] = ['pending', 'approved', 'rejected', 'paid'];
  readonly statusLabel = STATUS_LABEL;
  readonly categoryLabel = CATEGORY_LABEL;
  readonly rejectingId = signal<number | null>(null);
  readonly reason = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.minLength(3)],
  });

  constructor() {
    this.store.load();
  }

  startReject(id: number) {
    this.reason.reset();
    this.rejectingId.set(id);
  }

  confirmReject(event: Event, expense: Expense) {
    event.preventDefault();
    if (this.reason.invalid) return;
    this.store.review(expense.id, 'reject', this.reason.value.trim());
    this.rejectingId.set(null);
  }
}
