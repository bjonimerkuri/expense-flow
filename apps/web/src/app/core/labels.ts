import { Category, Role, Status } from './models';

export const STATUS_LABEL: Record<Status, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  paid: 'Paid',
};

export const CATEGORY_LABEL: Record<Category, string> = {
  travel: 'Travel',
  meals: 'Meals',
  software: 'Software',
  equipment: 'Equipment',
  other: 'Other',
};

export const ROLE_LABEL: Record<Role, string> = {
  employee: 'Employee',
  manager: 'Manager',
  finance: 'Finance',
};
