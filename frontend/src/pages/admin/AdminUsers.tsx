import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/format';
import { errorMessage } from '@/features/public/queries';
import { useAuth } from '@/features/auth/useAuth';
import type { PageResponse, RoleName, UserView } from '@/lib/types';
import { SectionHeader } from '@/components/layout/PortalLayout';
import { Button } from '@/components/ui/Button';
import { DataTable, Td, Th, Tr } from '@/components/ui/Table';
import { Alert, EmptyState, ErrorState, LoadingRows } from '@/components/ui/Feedback';
import { StatusBadge } from '@/components/ui/Status';
import { Pagination } from '@/components/ui/Pagination';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Search, User } from '@/components/ui/Icon';

const ROLE_LABELS: Record<RoleName, string> = {
  CUSTOMER: 'Kupac',
  EMPLOYEE: 'Majstor',
  WAREHOUSE_WORKER: 'Skladištar',
  ADMIN: 'Administrator',
};

const ALL_ROLES: RoleName[] = ['CUSTOMER', 'EMPLOYEE', 'WAREHOUSE_WORKER', 'ADMIN'];

export default function AdminUsers() {
  const queryClient = useQueryClient();
  const { user: me } = useAuth();
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const [editing, setEditing] = useState<UserView | null>(null);
  const [roles, setRoles] = useState<RoleName[]>([]);
  const [toDeactivate, setToDeactivate] = useState<UserView | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const params = new URLSearchParams({ page: String(page), size: '20' });
  if (query) params.set('q', query);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin', 'users', query, page],
    queryFn: () => api.get<PageResponse<UserView>>(`/api/admin/users?${params}`),
  });

  const saveRoles = useMutation({
    mutationFn: (payload: { id: number; roles: RoleName[] }) =>
      api.put<UserView>(`/api/admin/users/${payload.id}/roles`, { roles: payload.roles }),
    onSuccess: () => {
      setNotice('Uloge su izmijenjene.');
      setEditing(null);
      void queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });

  const toggleActive = useMutation({
    mutationFn: (payload: { id: number; active: boolean }) =>
      api.put<UserView>(`/api/admin/users/${payload.id}/${payload.active ? 'activate' : 'deactivate'}`),
    onSuccess: () => {
      setNotice('Status korisnika je promijenjen.');
      setToDeactivate(null);
      void queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });

  return (
    <>
      <SectionHeader
        title="Korisnici"
        description="Uloge određuju što tko smije. Provjera se radi na poslužitelju — mijenjanje uloge ovdje odmah vrijedi svugdje."
      />

      {notice ? <Alert tone="success" className="mb-5">{notice}</Alert> : null}
      {saveRoles.isError ? (
        <Alert tone="error" title="Izmjena uloga nije uspjela" className="mb-5">
          {errorMessage(saveRoles.error)}
        </Alert>
      ) : null}
      {toggleActive.isError ? (
        <Alert tone="error" title="Promjena statusa nije uspjela" className="mb-5">
          {errorMessage(toggleActive.error)}
        </Alert>
      ) : null}

      <form
        role="search"
        className="mb-5 flex flex-wrap gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          setQuery(search.trim());
          setPage(0);
        }}
      >
        <label htmlFor="pretraga-korisnika" className="sr-only">
          Pretraži korisnike
        </label>
        <div className="relative min-w-0 flex-1 sm:max-w-md">
          <Search size={20} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-asphalt-500" />
          <input
            id="pretraga-korisnika"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Ime ili e-mail"
            className="min-h-11 w-full rounded-plate border-2 border-asphalt-300 bg-white pl-10 pr-3 text-[0.9375rem] hover:border-asphalt-500 focus:border-midnight-800"
          />
        </div>
        <Button type="submit" variant="secondary">Traži</Button>
      </form>

      {isLoading ? (
        <LoadingRows rows={6} />
      ) : isError ? (
        <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} />
      ) : (data?.content.length ?? 0) === 0 ? (
        <EmptyState icon={<User size={40} />} title="Nema korisnika za taj upit" description="Pokušajte s drugim pojmom." />
      ) : (
        <>
          <DataTable
            caption="Popis korisnika s ulogama"
            head={
              <>
                <Th>Korisnik</Th>
                <Th>Uloge</Th>
                <Th>Status</Th>
                <Th>Registriran</Th>
                <Th><span className="sr-only">Radnje</span></Th>
              </>
            }
          >
            {data?.content.map((user) => (
              <Tr key={user.id}>
                <Td>
                  <span className="font-bold text-asphalt-950">{user.fullName}</span>
                  <span className="mt-0.5 block text-sm text-asphalt-500">{user.email}</span>
                  {user.phone ? (
                    <span className="block text-sm tabular-nums text-asphalt-500">{user.phone}</span>
                  ) : null}
                </Td>
                <Td>
                  {editing?.id === user.id ? (
                    <fieldset className="flex flex-col gap-1">
                      <legend className="sr-only">Uloge za {user.fullName}</legend>
                      {ALL_ROLES.map((role) => (
                        <label key={role} className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            className="h-4 w-4"
                            checked={roles.includes(role)}
                            onChange={(event) =>
                              setRoles((current) =>
                                event.target.checked
                                  ? [...current, role]
                                  : current.filter((entry) => entry !== role),
                              )
                            }
                          />
                          {ROLE_LABELS[role]}
                        </label>
                      ))}
                    </fieldset>
                  ) : (
                    <span className="flex flex-wrap gap-1">
                      {user.roles.map((role) => (
                        <StatusBadge key={role} tone={role === 'ADMIN' ? 'midnight' : 'neutral'} shape="rect">
                          {ROLE_LABELS[role]}
                        </StatusBadge>
                      ))}
                    </span>
                  )}
                </Td>
                <Td>
                  {user.active ? (
                    <StatusBadge tone="go" shape="circle">Aktivan</StatusBadge>
                  ) : (
                    <StatusBadge tone="stop" shape="circle">Neaktivan</StatusBadge>
                  )}
                </Td>
                <Td numeric className="whitespace-nowrap text-sm text-asphalt-500">
                  {formatDate(user.createdAt)}
                </Td>
                <Td align="right">
                  <div className="flex justify-end gap-1">
                    {editing?.id === user.id ? (
                      <>
                        <Button
                          size="sm"
                          loading={saveRoles.isPending}
                          onClick={() => saveRoles.mutate({ id: user.id, roles })}
                        >
                          Spremi
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>
                          Odustani
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditing(user);
                            setRoles(user.roles);
                          }}
                        >
                          Uloge
                        </Button>
                        {user.id !== me?.id ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              user.active
                                ? setToDeactivate(user)
                                : toggleActive.mutate({ id: user.id, active: true })
                            }
                          >
                            {user.active ? 'Deaktiviraj' : 'Aktiviraj'}
                          </Button>
                        ) : null}
                      </>
                    )}
                  </div>
                </Td>
              </Tr>
            ))}
          </DataTable>

          <div className="mt-6">
            <Pagination
              page={data!.page}
              totalPages={data!.totalPages}
              totalElements={data!.totalElements}
              onChange={setPage}
              label="korisnika"
            />
          </div>
        </>
      )}

      <ConfirmDialog
        open={toDeactivate !== null}
        title="Deaktivirati korisnika?"
        description={
          toDeactivate
            ? `${toDeactivate.fullName} se više neće moći prijaviti. Postojeći termini i rezervacije ostaju zabilježeni.`
            : ''
        }
        confirmLabel="Da, deaktiviraj"
        destructive
        loading={toggleActive.isPending}
        onConfirm={() => toDeactivate && toggleActive.mutate({ id: toDeactivate.id, active: false })}
        onCancel={() => setToDeactivate(null)}
      />
    </>
  );
}
