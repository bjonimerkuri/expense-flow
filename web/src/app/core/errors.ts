import { HttpErrorResponse } from '@angular/common/http';

export const errorMessage = (e: unknown): string => {
  const message = (e as HttpErrorResponse)?.error?.message;
  if (Array.isArray(message)) return message.join(', ');
  return message ?? 'Something went wrong';
};
