export type UserRole = 'admin' | 'member';

export interface User {
  id: string;
  email: string;
  googleId: string;
  name?: string;
  picture?: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}