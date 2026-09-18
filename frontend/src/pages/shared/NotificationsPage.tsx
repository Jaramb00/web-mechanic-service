import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatDateTime } from '@/lib/format';
import { errorMessage } from '@/features/public/queries';
import type { NotificationView, PageResponse } from '@/lib/types';
import { SectionHeader } from '@/components/layout/PortalLayout';
import { Button } from '@/components/ui/Button';
import { EmptyState, ErrorState, LoadingRows } from '@/components/ui/Feedback';
import { Bell } from '@/components/ui/Icon';
import { cn } from '@/lib/cn';

export default function NotificationsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['notifications', 0],
    queryFn: () => api.get<PageResponse<NotificationView>>('/api/me/notifications?page=0&size=30'),
  });

  const markAll = useMutation({
    mutationFn: () => api.post<void>('/api/me/notifications/read-all'),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const unread = data?.content.filter((item) => item.readAt === null).length ?? 0;

  return (
    <>
      <SectionHeader
        title="Obavijesti"
        description="Obavijesti o statusu termina i rezervacija. Šalju se unutar aplikacije; e-mail nije dio ove verzije."
        action={
          unread > 0 ? (
            <Button variant="outline" loading={markAll.isPending} onClick={() => markAll.mutate()}>
              Označi sve pročitanima
            </Button>
          ) : null
        }
      />

      {isLoading ? (
        <LoadingRows rows={4} />
      ) : isError ? (
        <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} />
      ) : (data?.content.length ?? 0) === 0 ? (
        <EmptyState
          icon={<Bell size={40} />}
          title="Nema obavijesti"
          description="Kad rezervirate termin ili se promijeni njegov status, obavijest će se pojaviti ovdje."
        />
      ) : (
        <ul className="space-y-3">
          {data?.content.map((notification) => (
            <li
              key={notification.id}
              className={cn(
                'rounded-sign border-2 bg-white px-4 py-3',
                notification.readAt === null ? 'border-signal-700' : 'border-ink-200',
              )}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="font-extrabold text-ink-950">
                  {notification.title}
                  {notification.readAt === null ? (
                    <span className="ml-2 align-middle text-xs font-bold uppercase text-signal-700">
                      novo
                    </span>
                  ) : null}
                </h2>
                <time
                  dateTime={notification.createdAt}
                  className="text-sm tabular-nums text-ink-500"
                >
                  {formatDateTime(notification.createdAt)}
                </time>
              </div>
              <p className="mt-1 max-w-[68ch] text-[0.9375rem] text-ink-700">{notification.body}</p>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
