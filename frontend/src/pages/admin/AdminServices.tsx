import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '@/lib/api';
import { formatPrice } from '@/lib/format';
import { errorMessage } from '@/features/public/queries';
import type { ServiceView } from '@/lib/types';
import { SectionHeader } from '@/components/layout/PortalLayout';
import { Button } from '@/components/ui/Button';
import { TextAreaField, TextField } from '@/components/ui/Field';
import { DataTable, Td, Th, Tr } from '@/components/ui/Table';
import { Alert, ErrorState, LoadingRows } from '@/components/ui/Feedback';
import { StatusBadge } from '@/components/ui/Status';
import { Edit, Plus } from '@/components/ui/Icon';

const schema = z.object({
  name: z.string().trim().min(1, 'Naziv je obavezan.').max(120),
  description: z.string().trim().max(1000).optional().default(''),
  price: z.coerce.number().min(0, 'Cijena ne može biti negativna.'),
  durationMinutes: z.coerce
    .number()
    .int()
    .min(10, 'Trajanje mora biti barem 10 minuta.')
    .max(480, 'Trajanje ne može biti dulje od 8 sati.'),
  sortOrder: z.coerce.number().int().min(0).default(0),
  active: z.boolean().default(true),
});

type FormValues = z.infer<typeof schema>;

export default function AdminServices() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<ServiceView | null>(null);
  const [creating, setCreating] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin', 'services'],
    queryFn: () => api.get<ServiceView[]>('/api/admin/services'),
  });

  const form = useForm<FormValues>({ resolver: zodResolver(schema) });

  const save = useMutation({
    mutationFn: (values: FormValues) => {
      const body = {
        name: values.name,
        description: values.description || null,
        price: values.price,
        durationMinutes: values.durationMinutes,
        sortOrder: values.sortOrder,
        active: values.active,
      };
      return editing
        ? api.put<ServiceView>(`/api/admin/services/${editing.id}`, body)
        : api.post<ServiceView>('/api/admin/services', body);
    },
    onSuccess: () => {
      setNotice(editing ? 'Usluga je izmijenjena.' : 'Usluga je dodana.');
      closeForm();
      void queryClient.invalidateQueries({ queryKey: ['admin', 'services'] });
      void queryClient.invalidateQueries({ queryKey: ['services'] });
    },
  });

  function openCreate() {
    setEditing(null);
    setCreating(true);
    form.reset({ name: '', description: '', price: 0, durationMinutes: 30, sortOrder: 0, active: true });
  }

  function openEdit(service: ServiceView) {
    setCreating(false);
    setEditing(service);
    form.reset({
      name: service.name,
      description: service.description ?? '',
      price: service.price,
      durationMinutes: service.durationMinutes,
      sortOrder: service.sortOrder,
      active: service.active,
    });
  }

  function closeForm() {
    setCreating(false);
    setEditing(null);
    form.reset();
  }

  const formOpen = creating || editing !== null;

  return (
    <>
      <SectionHeader
        title="Usluge i cjenik"
        description="Trajanje usluge određuje koliko termin zauzima u rasporedu, pa ga mijenjajte promišljeno."
        action={
          !formOpen ? (
            <Button onClick={openCreate}>
              <Plus size={18} />
              Nova usluga
            </Button>
          ) : null
        }
      />

      {notice ? <Alert tone="success" className="mb-5">{notice}</Alert> : null}

      {formOpen ? (
        <form
          onSubmit={form.handleSubmit((values) => save.mutate(values))}
          noValidate
          className="mb-6 rounded-card border border-asphalt-200 shadow-plate bg-white p-5"
        >
          <h2 className="text-lg font-extrabold text-asphalt-950">
            {editing ? `Izmjena: ${editing.name}` : 'Nova usluga'}
          </h2>

          {save.isError ? (
            <Alert tone="error" title="Spremanje nije uspjelo" className="mt-4">
              {errorMessage(save.error)}
            </Alert>
          ) : null}

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <TextField label="Naziv" required error={form.formState.errors.name?.message} {...form.register('name')} />
            <TextField
              label="Cijena (EUR)"
              type="number"
              step="0.01"
              min="0"
              required
              error={form.formState.errors.price?.message}
              {...form.register('price')}
            />
            <TextField
              label="Trajanje (min)"
              type="number"
              min="10"
              max="480"
              step="5"
              required
              hint="Mora odgovarati stvarnom trajanju — inače raspored ne valja."
              error={form.formState.errors.durationMinutes?.message}
              {...form.register('durationMinutes')}
            />
            <TextField
              label="Redoslijed prikaza"
              type="number"
              min="0"
              error={form.formState.errors.sortOrder?.message}
              {...form.register('sortOrder')}
            />
          </div>

          <div className="mt-4">
            <TextAreaField
              label="Opis"
              hint="Prikazuje se na javnoj stranici."
              error={form.formState.errors.description?.message}
              {...form.register('description')}
            />
          </div>

          <label className="mt-4 flex items-center gap-2.5 text-[0.9375rem] font-semibold text-asphalt-900">
            <input
              type="checkbox"
              className="h-5 w-5 rounded-[2px] border-2 border-asphalt-500"
              {...form.register('active')}
            />
            Usluga je aktivna i može se rezervirati
          </label>

          <div className="mt-5 flex gap-2">
            <Button type="submit" loading={save.isPending}>
              Spremi
            </Button>
            <Button type="button" variant="ghost" onClick={closeForm}>
              Odustani
            </Button>
          </div>
        </form>
      ) : null}

      {isLoading ? (
        <LoadingRows rows={5} />
      ) : isError ? (
        <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} />
      ) : (
        <DataTable
          caption="Popis usluga s cijenama i trajanjem"
          head={
            <>
              <Th>Usluga</Th>
              <Th align="right">Trajanje</Th>
              <Th align="right">Cijena</Th>
              <Th>Status</Th>
              <Th><span className="sr-only">Radnje</span></Th>
            </>
          }
        >
          {data?.map((service) => (
            <Tr key={service.id}>
              <Td>
                <span className="font-bold text-asphalt-950">{service.name}</span>
                {service.description ? (
                  <span className="mt-0.5 block max-w-[52ch] text-sm text-asphalt-500">
                    {service.description}
                  </span>
                ) : null}
              </Td>
              <Td align="right" numeric className="whitespace-nowrap">{service.durationMinutes} min</Td>
              <Td align="right" numeric>{formatPrice(service.price)}</Td>
              <Td>
                {service.active ? (
                  <StatusBadge tone="go" shape="circle">Aktivna</StatusBadge>
                ) : (
                  <StatusBadge tone="neutral" shape="circle">Neaktivna</StatusBadge>
                )}
              </Td>
              <Td align="right">
                <Button variant="ghost" size="sm" onClick={() => openEdit(service)}>
                  <Edit size={16} />
                  Uredi
                </Button>
              </Td>
            </Tr>
          ))}
        </DataTable>
      )}
    </>
  );
}
