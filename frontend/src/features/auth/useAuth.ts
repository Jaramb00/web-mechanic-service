import { useContext } from 'react';
import { AuthContext, type AuthContextValue } from './context';
import type { AuthUser } from '@/lib/types';

/**
 * Pristup podacima o prijavljenom korisniku.
 *
 * Odvojeno od providera jer React Fast Refresh ne može osvježiti datoteku koja
 * uz komponentu izvozi i obične funkcije.
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth se koristi izvan AuthProvider-a.');
  return context;
}

/** Kamo korisnika odvesti nakon prijave — ovisi o ulozi koju ima. */
export function homeRouteFor(user: AuthUser | null): string {
  if (!user) return '/prijava';
  if (user.roles.includes('ADMIN')) return '/admin';
  if (user.roles.includes('EMPLOYEE')) return '/radionica';
  if (user.roles.includes('WAREHOUSE_WORKER')) return '/skladiste';
  return '/moj-racun';
}
