import { CurrencyPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ExpenseApi } from '../core/expense.api';
import { SummaryRow } from '../core/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CurrencyPipe],
  template: `
    <h2>Dashboard</h2>
    @if (summary(); as s) {
      <section class="panel">
        <h3>Spend by category (excluding rejected)</h3>
        @for (row of s.byCategory; track row.category) {
          <div class="bar-row">
            <span>{{ row.category }}</span>
            <div class="bar" [style.width.%]="percent(row, s.byCategory)"></div>
            <span>{{ row.total / 100 | currency: 'EUR' }} ({{ row.count }})</span>
          </div>
        } @empty {
          <p class="hint">No data yet.</p>
        }
      </section>
      <section class="panel">
        <h3>Totals by status</h3>
        @for (row of s.byStatus; track row.status) {
          <div class="bar-row">
            <span><span [class]="'badge ' + row.status">{{ row.status }}</span></span>
            <div class="bar" [style.width.%]="percent(row, s.byStatus)"></div>
            <span>{{ row.total / 100 | currency: 'EUR' }} ({{ row.count }})</span>
          </div>
        }
      </section>
    } @else {
      <p class="hint">Loading…</p>
    }
  `,
})
export class DashboardComponent {
  readonly summary = toSignal(inject(ExpenseApi).summary());

  percent(row: SummaryRow, rows: SummaryRow[]) {
    const max = Math.max(1, ...rows.map((r) => r.total));
    return (row.total / max) * 100;
  }
}
