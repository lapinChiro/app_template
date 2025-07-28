export interface User {
  id: string;
  email: string;
  name: string;
  role: 'member' | 'admin';
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserInput {
  email: string;
  name: string;
  password: string;
  role?: 'member' | 'admin';
}

export interface UpdateUserInput {
  name?: string;
  role?: 'member' | 'admin';
}