import { CurrencyPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ExpenseApi } from '../core/expense.api';
import { CATEGORY_LABEL, STATUS_LABEL } from '../core/labels';
import { Category, Status, SummaryRow } from '../core/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CurrencyPipe],
  template: `
    <div class="page-head"><h1>Dashboard</h1></div>
    @if (summary(); as s) {
      <div class="dash">
        <section class="panel" aria-labelledby="cat-h">
          <h2 id="cat-h">Spend by category</h2>
          <p class="muted small">Rejected expenses are excluded.</p>
          <ul class="bars">
            @for (row of s.byCategory; track row.category) {
              <li class="bar-row">
                <span>{{ categoryLabel[$any(row.category)] ?? row.category }}</span>
                <span class="bar-track" aria-hidden="true">
                  <span class="bar-fill" [style.width.%]="percent(row, s.byCategory)" style="></span>
                </span>
                <span class="bar-value">
                  {{ row.total / 100 | currency: 'EUR' }} <small>({{ row.count }})</small>
                </span>
              </li>
            } @empty {
              <li class="muted">No spend recorded yet.</li>
            }
          </ul>
        </section>

        <section class="panel" aria-labelledby="status-h">
          <h2 id="status-h">Totals by status</h2>
          <ul class="bars">
            @for (row of s.byStatus; track row.status) {
              <li class="bar-row">
                <span>{{ statusLabel[$any(row.status)] ?? row.status }}</span>
                <span class="bar-track" aria-hidden="true">
                  <span class="bar-fill" [style.width.%]="percent(row, s.byStatus)" style="></span>
                </span>
                <span class="bar-value">
                  {{ row.total / 100 | currency: 'EUR' }} <small>({{ row.count }})</small>
                </span>
              </li>
            } @empty {
              <li class="muted">No expenses yet.</li>
            }
          </ul>
        </section>
      </div>
    } @else {
      <p class="muted" role="status">Loading…</p>
    }
  `,
})
export class DashboardComponent {
  readonly summary = toSignal(inject(ExpenseApi).summary());
  readonly categoryLabel: Record<Category, string> = CATEGORY_LABEL;
  readonly statusLabel: Record<Status, string> = STATUS_LABEL;

  percent(row: SummaryRow, rows: SummaryRow[]) {
    const max = Math.max(1, ...rows.map((r) => r.total));
    return (row.total / max) * 100;
  }
}
