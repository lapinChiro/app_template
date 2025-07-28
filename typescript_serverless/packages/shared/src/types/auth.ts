export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
}

export interface JWTPayload {
  sub: string; // user id
  email: string;
  role: 'member' | 'admin';
  iat: number;
  exp: number;
}