export const ROLES = ['employee', 'manager', 'finance'] as const;
export type Role = (typeof ROLES)[number];

export interface AuthUser {
  id: number;
  email: string;
  role: Role;
}
