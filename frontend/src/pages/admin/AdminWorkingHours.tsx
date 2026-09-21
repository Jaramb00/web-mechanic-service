import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { trimSeconds, weekdayName } from '@/lib/format';
import { errorMessage } from '@/features/public/queries';
import type { WorkingHoursView } from '@/lib/types';
import { SectionHeader } from '@/components/layout/PortalLayout';
import { Button } from '@/components/ui/Button';
import { Alert, ErrorState, LoadingRows } from '@/components/ui/Feedback';

export default function AdminWorkingHours() {
  const queryClient = useQueryClient();
  const [notice, setNotice] = useState<string | null>(null);
  const [draft, setDraft] = useState<Record<number, WorkingHoursView>>({});

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin', 'working-hours'],
    queryFn: () => api.get<WorkingHoursView[]>('/api/admin/working-hours'),
  });

  const save = useMutation({
    mutationFn: (entry: WorkingHoursView) =>
      api.put<WorkingHoursView>('/api/admin/working-hours', {
        dayOfWeek: entry.dayOfWeek,
        openTime: entry.closed ? null : trimSeconds(entry.openTime),
        closeTime: entry.closed ? null : trimSeconds(entry.closeTime),
        closed: entry.closed,
      }),
    onSuccess: (_result, entry) => {
      setNotice(`Radno vrijeme za ${weekdayName(entry.dayOfWeek)} je spremljeno.`);
      setDraft((current) => {
        const next = { ...current };
        delete next[entry.dayOfWeek];
        return next;
      });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'working-hours'] });
      void queryClient.invalidateQueries({ queryKey: ['working-hours'] });
      void queryClient.invalidateQueries({ queryKey: ['availability'] });
    },
  });

  function value(entry: WorkingHoursView): WorkingHoursView {
    return draft[entry.dayOfWeek] ?? entry;
  }

  function update(entry: WorkingHoursView, patch: Partial<WorkingHoursView>) {
    setDraft((current) => ({
      ...current,
      [entry.dayOfWeek]: { ...value(entry), ...patch },
    }));
  }

  return (
    <>
      <SectionHeader
        title="Radno vrijeme"
        description="Radno vrijeme određuje koje se termine uopće može ponuditi. Izmjena odmah utječe na javni prikaz slobodnih termina."
      />

      {notice ? <Alert tone="success" className="mb-5">{notice}</Alert> : null}
      {save.isError ? (
        <Alert tone="error" title="Spremanje nije uspjelo" className="mb-5">
          {errorMessage(save.error)}
        </Alert>
      ) : null}

      {isLoading ? (
        <LoadingRows rows={7} />
      ) : isError ? (
        <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} />
      ) : (
        <ul className="space-y-px overflow-hidden rounded-control border-2 border-asphalt-950">
          {data?.map((entry) => {
            const current = value(entry);
            const dirty = draft[entry.dayOfWeek] !== undefined;
            return (
              <li
                key={entry.dayOfWeek}
                className="flex flex-wrap items-center gap-x-4 gap-y-3 bg-white px-4 py-3"
              >
                <span className="w-32 shrink-0 font-bold capitalize text-asphalt-950">
                  {weekdayName(entry.dayOfWeek)}
                </span>

                <label className="flex items-center gap-2 text-[0.9375rem] font-semibold text-asphalt-900">
                  <input
                    type="checkbox"
                    className="h-5 w-5"
                    checked={current.closed}
                    onChange={(event) => update(entry, { closed: event.target.checked })}
                  />
                  Zatvoreno
                </label>

                <span className="flex items-center gap-2">
                  <label className="sr-only" htmlFor={`otvara-${entry.dayOfWeek}`}>
                    Otvaranje, {weekdayName(entry.dayOfWeek)}
                  </label>
                  <input
                    id={`otvara-${entry.dayOfWeek}`}
                    type="time"
                    disabled={current.closed}
                    value={trimSeconds(current.openTime)}
                    onChange={(event) => update(entry, { openTime: event.target.value })}
                    className="min-h-11 rounded-plate border-2 border-asphalt-300 bg-white px-2 tabular-nums disabled:bg-asphalt-50 disabled:text-asphalt-300"
                  />
                  <span aria-hidden="true" className="text-asphalt-500">–</span>
                  <label className="sr-only" htmlFor={`zatvara-${entry.dayOfWeek}`}>
                    Zatvaranje, {weekdayName(entry.dayOfWeek)}
                  </label>
                  <input
                    id={`zatvara-${entry.dayOfWeek}`}
                    type="time"
                    disabled={current.closed}
                    value={trimSeconds(current.closeTime)}
                    onChange={(event) => update(entry, { closeTime: event.target.value })}
                    className="min-h-11 rounded-plate border-2 border-asphalt-300 bg-white px-2 tabular-nums disabled:bg-asphalt-50 disabled:text-asphalt-300"
                  />
                </span>

                <Button
                  size="sm"
                  className="ml-auto"
                  variant={dirty ? 'primary' : 'ghost'}
                  disabled={!dirty}
                  loading={save.isPending && save.variables?.dayOfWeek === entry.dayOfWeek}
                  onClick={() => save.mutate(current)}
                >
                  Spremi
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
