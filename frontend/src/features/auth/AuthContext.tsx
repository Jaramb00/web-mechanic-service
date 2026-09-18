import { useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { AuthUser, RoleName } from '@/lib/types';
import {
  AUTH_QUERY_KEY,
  AuthContext,
  type AuthContextValue,
  type LoginInput,
  type RegisterInput,
} from './context';

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  /**
   * Prijavljenost se ne čita iz localStorage nego iz backenda: token je u
   * HttpOnly cookieju koji JavaScript ne vidi, pa je stanje na poslužitelju
   * jedini izvor istine.
   */
  const { data, isLoading } = useQuery({
    queryKey: AUTH_QUERY_KEY,
    queryFn: async () => {
      // Backend na `/api/auth/me` vraća 204 kad nitko nije prijavljen, pa
      // odsutnost sesije nije greška i ne završava u konzoli kao 401.
      const user = await api.get<AuthUser | undefined>('/api/auth/me');
      return user ?? null;
    },
    staleTime: 60_000,
    retry: false,
  });

  const user = data ?? null;

  const loginMutation = useMutation({
    mutationFn: (input: LoginInput) => api.post<AuthUser>('/api/auth/login', input),
    onSuccess: (authUser) => queryClient.setQueryData(AUTH_QUERY_KEY, authUser),
  });

  const registerMutation = useMutation({
    mutationFn: (input: RegisterInput) => api.post<AuthUser>('/api/auth/register', input),
    onSuccess: (authUser) => queryClient.setQueryData(AUTH_QUERY_KEY, authUser),
  });

  const logoutMutation = useMutation({
    mutationFn: () => api.post<void>('/api/auth/logout'),
    onSuccess: () => {
      queryClient.setQueryData(AUTH_QUERY_KEY, null);
      // Odjava mora obrisati sve dohvaćene podatke, inače bi sljedeći korisnik
      // na istom pregledniku nakratko vidio tuđe termine iz predmemorije.
      queryClient.clear();
    },
  });

  const hasRole = useCallback(
    (...roles: RoleName[]) => (user ? roles.some((role) => user.roles.includes(role)) : false),
    [user],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      login: (input) => loginMutation.mutateAsync(input),
      register: (input) => registerMutation.mutateAsync(input),
      logout: () => logoutMutation.mutateAsync(),
      hasRole,
    }),
    [user, isLoading, loginMutation, registerMutation, logoutMutation, hasRole],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
