export type Role = 'employee' | 'manager' | 'finance';
export type Status = 'pending' | 'approved' | 'rejected' | 'paid';
export type Category = 'travel' | 'meals' | 'software' | 'equipment' | 'other';
export type ReviewAction = 'approve' | 'reject' | 'pay';

export interface User {
  id: number;
  email: string;
  role: Role;
}

export interface Expense {
  id: number;
  title: string;
  description: string | null;
  amount: number;
  category: Category;
  status: Status;
  submittedBy: number;
  submitterEmail: string | null;
  rejectionReason: string | null;
  createdAt: string;
}

export interface ExpensePage {
  items: Expense[];
  total: number;
  page: number;
  pageSize: number;
}

export interface SummaryRow {
  category?: string;
  status?: string;
  total: number;
  count: number;
}

export interface Summary {
  byCategory: SummaryRow[];
  byStatus: SummaryRow[];
}
