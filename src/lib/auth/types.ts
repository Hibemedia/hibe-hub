export type UserRole = 'admin' | 'manager' | 'klant';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface AuthUser {
  user: User | null;
  session: any;
  loading: boolean;
}