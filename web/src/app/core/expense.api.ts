import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { API_URL } from './config';
import { Category, Expense, ExpensePage, Summary } from './models';

@Injectable({ providedIn: 'root' })
export class ExpenseApi {
  private readonly http = inject(HttpClient);

  list(query: { status: string; page: number }) {
    let params = new HttpParams().set('page', query.page).set('pageSize', 10);
    if (query.status) params = params.set('status', query.status);
    return this.http.get<ExpensePage>(`${API_URL}/expenses`, { params });
  }

  create(body: { title: string; description?: string; amount: number; category: Category }) {
    return this.http.post<Expense>(`${API_URL}/expenses`, body);
  }

  approve(id: number) {
    return this.http.post<Partial<Expense>>(`${API_URL}/expenses/${id}/approve`, {});
  }

  reject(id: number, reason: string) {
    return this.http.post<Partial<Expense>>(`${API_URL}/expenses/${id}/reject`, { reason });
  }

  pay(id: number) {
    return this.http.post<Partial<Expense>>(`${API_URL}/expenses/${id}/pay`, {});
  }

  summary() {
    return this.http.get<Summary>(`${API_URL}/expenses/summary`);
  }
}
