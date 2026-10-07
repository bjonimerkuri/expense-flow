import { Routes } from '@angular/router';
import { authGuard, roleGuard } from './core/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/login.component').then((m) => m.LoginComponent),
  },
  {
    path: '',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () => import('./features/expense-list.component').then((m) => m.ExpenseListComponent),
      },
      {
        path: 'expenses/new',
        loadComponent: () => import('./features/expense-form.component').then((m) => m.ExpenseFormComponent),
      },
      {
        path: 'dashboard',
        canActivate: [roleGuard('manager', 'finance')],
        loadComponent: () => import('./features/dashboard.component').then((m) => m.DashboardComponent),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
