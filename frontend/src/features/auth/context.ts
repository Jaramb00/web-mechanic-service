import { createContext } from 'react';
import type { AuthUser, RoleName } from '@/lib/types';

export type LoginInput = { email: string; password: string };

export type RegisterInput = {
  email: string;
  password: string;
  fullName: string;
  phone: string;
  /** Honeypot polje; uvijek se šalje prazno. */
  website: string;
};

export type AuthContextValue = {
  user: AuthUser | null;
  isLoading: boolean;
  login: (input: LoginInput) => Promise<AuthUser>;
  register: (input: RegisterInput) => Promise<AuthUser>;
  logout: () => Promise<void>;
  hasRole: (...roles: RoleName[]) => boolean;
};

/**
 * Sam kontekst živi odvojeno od providera: React Fast Refresh ne može osvježiti
 * datoteku koja uz komponentu izvozi i kontekst.
 */
export const AuthContext = createContext<AuthContextValue | null>(null);

export const AUTH_QUERY_KEY = ['auth', 'me'] as const;
