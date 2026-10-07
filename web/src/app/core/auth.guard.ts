import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { Role } from './models';

export const authGuard: CanActivateFn = () =>
  inject(AuthService).user() ? true : inject(Router).createUrlTree(['/login']);

export const roleGuard =
  (...roles: Role[]): CanActivateFn =>
  () =>
    inject(AuthService).hasRole(...roles) ? true : inject(Router).createUrlTree(['/']);
