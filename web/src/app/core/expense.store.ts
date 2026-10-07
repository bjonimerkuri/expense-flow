import { HttpErrorResponse } from '@angular/common/http';
import { computed, inject } from '@angular/core';
import { tapResponse } from '@ngrx/operators';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import { errorMessage } from './errors';
import { ExpenseApi } from './expense.api';
import { Expense, ReviewAction, Status } from './models';

interface ExpenseState {
  items: Expense[];
  total: number;
  page: number;
  pageSize: number;
  status: string;
  loading: boolean;
  error: string;
}

const initialState: ExpenseState = {
  items: [],
  total: 0,
  page: 1,
  pageSize: 10,
  status: '',
  loading: false,
  error: '',
};

const NEXT_STATUS: Record<ReviewAction, Status> = {
  approve: 'approved',
  reject: 'rejected',
  pay: 'paid',
};

export const ExpenseStore = signalStore(
  { providedIn: 'root' },
  withState<ExpenseState>(initialState),
  withComputed(({ total, pageSize }) => ({
    pages: computed(() => Math.max(1, Math.ceil(total() / pageSize()))),
  })),
  withMethods((store, api = inject(ExpenseApi)) => {
    const load = rxMethod<void>(
      pipe(
        tap(() => patchState(store, { loading: true, error: '' })),
        switchMap(() =>
          api.list({ status: store.status(), page: store.page() }).pipe(
            tapResponse({
              next: (result) =>
                patchState(store, {
                  items: result.items,
                  total: result.total,
                  page: result.page,
                  loading: false,
                }),
              error: (e: HttpErrorResponse) => patchState(store, { loading: false, error: errorMessage(e) }),
            }),
          ),
        ),
      ),
    );

    return {
      load,
      setStatus(status: string) {
        patchState(store, { status, page: 1 });
        load();
      },
      setPage(page: number) {
        patchState(store, { page });
        load();
      },
      review(id: number, action: ReviewAction, reason?: string) {
        const previous = store.items();
        patchState(store, {
          error: '',
          items: previous.map((e) => (e.id === id ? { ...e, status: NEXT_STATUS[action] } : e)),
        });

        const request =
          action === 'approve' ? api.approve(id) : action === 'reject' ? api.reject(id, reason ?? '') : api.pay(id);

        request.subscribe({
          next: (updated) =>
            patchState(store, { items: store.items().map((e) => (e.id === id ? { ...e, ...updated } : e)) }),
          error: (e: HttpErrorResponse) => patchState(store, { items: previous, error: errorMessage(e) }),
        });
      },
    };
  }),
);
