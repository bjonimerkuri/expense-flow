import { HttpErrorResponse } from '@angular/common/http';

export const errorMessage = (e: unknown): string => {
  const error = e as HttpErrorResponse;
  if (error?.status === 0) return 'Cannot reach the server. Check your connection and try again.';
  const message = error?.error?.message;
  if (Array.isArray(message)) return message.join(', ');
  return message ?? 'Something went wrong. Try again.';
};
