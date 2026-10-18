import { AsyncPipe, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, EMPTY, map, switchMap, tap } from 'rxjs';
import { errorMessage } from '../core/errors';
import { ExpenseApi } from '../core/expense.api';
import { CATEGORY_LABEL } from '../core/labels';
import { StatusBadgeComponent } from '../shared/badge.component';

@Component({
  selector: 'app-expense-detail',
  standalone: true,
  imports: [AsyncPipe, CurrencyPipe, DatePipe, RouterLink, StatusBadgeComponent],
  template: `
    <a class="back" routerLink="/">Back to expenses</a>
    <div aria-live="polite">
      @if (error()) {
        <p class="error" role="alert">{{ error() }}</p>
      }
    </div>

    @if (expense$ | async; as e) {
      <div class="page-head">
        <h1>{{ e.title }}</h1>
        <app-status [value]="e.status" />
      </div>
      <div class="detail-grid">
        <section class="panel history" aria-labelledby="history-h">
          <h2 id="history-h">History</h2>
          <ol class="timeline">
            @for (h of e.history; track $index) {
              <li>
                <div class="event">
                  <app-status [value]="h.toStatus" />
                  <span>{{ h.actorEmail }}</span>
                  <time class="muted small" [attr.datetime]="h.createdAt">{{ h.createdAt | date: 'medium' }}</time>
                </div>
                @if (h.note) {
                  <p class="muted">{{ h.note }}</p>
                }
              </li>
            }
          </ol>
        </section>

        <aside class="panel summary" aria-label="Expense details">
          <p class="amount-big">{{ e.amount / 100 | currency: 'EUR' }}</p>
          <dl class="facts">
            <dt>Category</dt>
            <dd>{{ categoryLabel[e.category] }}</dd>
            <dt>Submitted by</dt>
            <dd>{{ e.submitterEmail }}</dd>
            <dt>Submitted</dt>
            <dd>{{ e.createdAt | date: 'medium' }}</dd>
            @if (e.description) {
              <dt>Notes</dt>
              <dd>{{ e.description }}</dd>
            }
            @if (e.rejectionReason) {
              <dt>Rejected because</dt>
              <dd>{{ e.rejectionReason }}</dd>
            }
          </dl>
        </aside>
      </div>
    } @else if (loading() && !error()) {
      <p class="muted" role="status">Loading expense…</p>
    }
  `,
})
export class ExpenseDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(ExpenseApi);

  readonly categoryLabel = CATEGORY_LABEL;
  readonly error = signal('');
  readonly loading = signal(true);

  readonly expense$ = this.route.paramMap.pipe(
    map((params) => Number(params.get('id'))),
    switchMap((id) =>
      this.api.get(id).pipe(
        tap(() => this.loading.set(false)),
        catchError((e) => {
          this.error.set(errorMessage(e));
          this.loading.set(false);
          return EMPTY;
        }),
      ),
    ),
  );
}
