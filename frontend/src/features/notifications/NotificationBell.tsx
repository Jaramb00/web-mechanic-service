import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { Bell } from '@/components/ui/Icon';

/**
 * Broj nepročitanih obavijesti u zaglavlju portala.
 *
 * Osvježava se svake dvije minute: obavijesti nisu hitne, a češće pitanje
 * poslužitelja bilo bi trošak bez koristi.
 */
export function NotificationBell() {
  const { data } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => api.get<{ count: number }>('/api/me/notifications/unread-count'),
    refetchInterval: 120_000,
    staleTime: 60_000,
  });

  const count = data?.count ?? 0;

  return (
    <Link
      to="/obavijesti"
      className="relative flex min-h-11 min-w-11 items-center justify-center rounded-plate text-white no-underline hover:bg-ink-900"
      aria-label={count > 0 ? `Obavijesti, ${count} nepročitanih` : 'Obavijesti'}
    >
      <Bell size={22} />
      {count > 0 ? (
        <span className="absolute right-1 top-1 min-w-5 rounded-full bg-work-500 px-1 text-center text-xs font-bold leading-5 text-ink-950">
          {count > 9 ? '9+' : count}
        </span>
      ) : null}
    </Link>
  );
}
