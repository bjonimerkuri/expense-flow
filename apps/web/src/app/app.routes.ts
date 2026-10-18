import { Routes } from '@angular/router';
import { authGuard, roleGuard } from './core/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    title: 'Sign in · Expense Flow',
    loadComponent: () => import('./features/login.component').then((m) => m.LoginComponent),
  },
  {
    path: '',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        title: 'Expenses · Expense Flow',
        loadComponent: () => import('./features/expense-list.component').then((m) => m.ExpenseListComponent),
      },
      {
        path: 'expenses/new',
        title: 'New expense · Expense Flow',
        loadComponent: () => import('./features/expense-form.component').then((m) => m.ExpenseFormComponent),
      },
      {
        path: 'expenses/:id',
        title: 'Expense · Expense Flow',
        loadComponent: () => import('./features/expense-detail.component').then((m) => m.ExpenseDetailComponent),
      },
      {
        path: 'dashboard',
        title: 'Dashboard · Expense Flow',
        canActivate: [roleGuard('manager', 'finance')],
        loadComponent: () => import('./features/dashboard.component').then((m) => m.DashboardComponent),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
