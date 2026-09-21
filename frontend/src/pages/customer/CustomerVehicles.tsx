import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '@/lib/api';
import { errorMessage } from '@/features/public/queries';
import type { VehicleView } from '@/lib/types';
import { SectionHeader } from '@/components/layout/PortalLayout';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/Field';
import { Alert, EmptyState, ErrorState, LoadingRows } from '@/components/ui/Feedback';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Car, Plus, Trash } from '@/components/ui/Icon';

const schema = z.object({
  make: z.string().trim().min(1, 'Marka je obavezna.').max(80),
  model: z.string().trim().min(1, 'Model je obavezan.').max(80),
  modelYear: z
    .union([z.literal(''), z.coerce.number().int().min(1900, 'Godina nije ispravna.').max(2100, 'Godina nije ispravna.')])
    .optional(),
  registration: z
    .string()
    .trim()
    .min(4, 'Registracija je prekratka.')
    .max(20)
    .regex(/^[A-Za-z0-9ČĆŽŠĐčćžšđ -]{4,20}$/, 'Registracija nije ispravnog oblika.'),
  tireSize: z.string().trim().max(40).optional().default(''),
  vin: z
    .string()
    .trim()
    .regex(/^$|^[A-HJ-NPR-Z0-9]{11,17}$/, 'VIN nije ispravnog oblika.')
    .optional()
    .default(''),
});

type FormValues = z.infer<typeof schema>;

export default function CustomerVehicles() {
  const queryClient = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [toDelete, setToDelete] = useState<VehicleView | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['me', 'vehicles'],
    queryFn: () => api.get<VehicleView[]>('/api/me/vehicles'),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const create = useMutation({
    mutationFn: (values: FormValues) =>
      api.post<VehicleView>('/api/me/vehicles', {
        make: values.make,
        model: values.model,
        modelYear: values.modelYear === '' || values.modelYear === undefined ? null : values.modelYear,
        registration: values.registration,
        tireSize: values.tireSize || null,
        vin: values.vin || null,
      }),
    onSuccess: () => {
      setAdding(false);
      setNotice('Vozilo je dodano.');
      reset();
      void queryClient.invalidateQueries({ queryKey: ['me', 'vehicles'] });
    },
  });

  const remove = useMutation({
    mutationFn: (id: number) => api.del<void>(`/api/me/vehicles/${id}`),
    onSuccess: () => {
      setToDelete(null);
      setNotice('Vozilo je obrisano.');
      void queryClient.invalidateQueries({ queryKey: ['me', 'vehicles'] });
    },
  });

  return (
    <>
      <SectionHeader
        title="Moja vozila"
        description="Vozilo je potrebno za rezervaciju termina — po njemu znamo koje gume i dimenzije očekivati."
        action={
          !adding ? (
            <Button onClick={() => setAdding(true)}>
              <Plus size={18} />
              Dodaj vozilo
            </Button>
          ) : null
        }
      />

      {notice ? (
        <Alert tone="success" className="mb-5">
          {notice}
        </Alert>
      ) : null}

      {adding ? (
        <form
          onSubmit={handleSubmit((values) => create.mutate(values))}
          noValidate
          className="mb-6 rounded-control border-2 border-asphalt-950 bg-white p-5"
        >
          <h2 className="text-lg font-extrabold text-asphalt-950">Novo vozilo</h2>

          {create.isError ? (
            <Alert tone="error" title="Vozilo nije spremljeno" className="mt-4">
              {errorMessage(create.error)}
            </Alert>
          ) : null}

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <TextField label="Marka" required error={errors.make?.message} {...register('make')} />
            <TextField label="Model" required error={errors.model?.message} {...register('model')} />
            <TextField
              label="Godina"
              type="number"
              inputMode="numeric"
              error={errors.modelYear?.message}
              {...register('modelYear')}
            />
            <TextField
              label="Registracija"
              required
              hint="Npr. ZG1234AB"
              error={errors.registration?.message}
              {...register('registration')}
            />
            <TextField
              label="Dimenzija guma"
              hint="Npr. 205/55 R16"
              error={errors.tireSize?.message}
              {...register('tireSize')}
            />
            <TextField label="VIN" hint="Neobavezno." error={errors.vin?.message} {...register('vin')} />
          </div>

          <div className="mt-5 flex gap-2">
            <Button type="submit" loading={isSubmitting || create.isPending}>
              Spremi vozilo
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setAdding(false);
                reset();
              }}
            >
              Odustani
            </Button>
          </div>
        </form>
      ) : null}

      {remove.isError ? (
        <Alert tone="error" title="Brisanje nije uspjelo" className="mb-5">
          {errorMessage(remove.error)}
        </Alert>
      ) : null}

      {isLoading ? (
        <LoadingRows rows={3} />
      ) : isError ? (
        <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} />
      ) : (data?.length ?? 0) === 0 ? (
        <EmptyState
          icon={<Car size={40} />}
          title="Nemate upisano nijedno vozilo"
          description="Dodajte vozilo da biste mogli rezervirati termin. Podaci se koriste samo za servis."
          action={<Button onClick={() => setAdding(true)}>Dodaj vozilo</Button>}
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {data?.map((vehicle) => (
            <li key={vehicle.id} className="rounded-control border-2 border-asphalt-950 bg-white">
              <div className="flex items-start gap-3 p-4">
                <span className="mt-0.5 text-midnight-800">
                  <Car size={22} />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-[1.0625rem] font-extrabold text-asphalt-950">
                    {vehicle.make} {vehicle.model}
                  </h3>
                  <dl className="mt-2 space-y-0.5 text-sm">
                    <div className="flex gap-2">
                      <dt className="text-asphalt-500">Registracija:</dt>
                      <dd className="font-bold tabular-nums text-asphalt-900">{vehicle.registration}</dd>
                    </div>
                    {vehicle.modelYear ? (
                      <div className="flex gap-2">
                        <dt className="text-asphalt-500">Godina:</dt>
                        <dd className="tabular-nums text-asphalt-900">{vehicle.modelYear}</dd>
                      </div>
                    ) : null}
                    {vehicle.tireSize ? (
                      <div className="flex gap-2">
                        <dt className="text-asphalt-500">Gume:</dt>
                        <dd className="tabular-nums text-asphalt-900">{vehicle.tireSize}</dd>
                      </div>
                    ) : null}
                  </dl>
                </div>
              </div>
              <div className="border-t border-asphalt-200 bg-asphalt-50 px-4 py-2">
                <Button variant="ghost" size="sm" onClick={() => setToDelete(vehicle)}>
                  <Trash size={16} />
                  Obriši
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={toDelete !== null}
        title="Obrisati vozilo?"
        description={
          toDelete
            ? `${toDelete.make} ${toDelete.model} (${toDelete.registration}) bit će obrisano. Ako je vezano uz postojeće termine, brisanje neće biti moguće.`
            : ''
        }
        confirmLabel="Da, obriši"
        destructive
        loading={remove.isPending}
        onConfirm={() => toDelete && remove.mutate(toDelete.id)}
        onCancel={() => setToDelete(null)}
      />
    </>
  );
}
