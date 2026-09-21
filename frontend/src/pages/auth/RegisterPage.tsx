import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSeo } from '@/lib/seo';
import { useAuth, homeRouteFor } from '@/features/auth/useAuth';
import { errorMessage } from '@/features/public/queries';
import { Section } from '@/components/ui/Section';
import { Button } from '@/components/ui/Button';
import { HoneypotField, TextField } from '@/components/ui/Field';
import { Alert } from '@/components/ui/Feedback';

/**
 * Validacija na klijentu postoji radi brze povratne informacije, ne radi
 * sigurnosti — ista pravila vrijede i na poslužitelju, koji je jedini mjerodavan.
 */
const schema = z.object({
  fullName: z.string().trim().min(2, 'Upišite ime i prezime.').max(160, 'Predugačko ime.'),
  email: z.string().trim().email('E-mail nije ispravnog oblika.').max(255),
  phone: z
    .string()
    .trim()
    .regex(/^$|^[+0-9 ()/-]{6,32}$/, 'Broj telefona nije ispravnog oblika.')
    .optional()
    .default(''),
  password: z
    .string()
    .min(8, 'Lozinka mora imati barem 8 znakova.')
    .max(200)
    .regex(/\d/, 'Lozinka mora sadržavati barem jednu znamenku.')
    .regex(/[A-Za-zČĆŽŠĐčćžšđ]/, 'Lozinka mora sadržavati barem jedno slovo.'),
  website: z.string().max(0).optional().default(''),
});

type FormValues = z.infer<typeof schema>;

export function RegisterPage() {
  useSeo({
    title: 'Otvaranje računa',
    description: 'Otvorite račun da biste mogli rezervirati termine i pratiti servise svojih vozila.',
    path: '/registracija',
    noIndex: true,
  });

  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { fullName: '', email: '', phone: '', password: '', website: '' },
  });

  async function onSubmit(values: FormValues) {
    setServerError(null);
    try {
      const user = await registerUser({
        email: values.email,
        password: values.password,
        fullName: values.fullName,
        phone: values.phone ?? '',
        website: values.website ?? '',
      });
      navigate(homeRouteFor(user), { replace: true });
    } catch (cause) {
      setServerError(errorMessage(cause));
    }
  }

  return (
    <Section tone="light">
      <div className="mx-auto max-w-md">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Otvaranje računa</h1>
        <p className="mt-2 text-[1.0625rem] text-asphalt-700">
          Već imate račun?{' '}
          <Link to="/prijava" className="font-bold text-midnight-800">
            Prijavite se
          </Link>
          .
        </p>

        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="relative mt-6 space-y-4 rounded-control border-2 border-asphalt-950 bg-white p-5 sm:p-6"
        >
          {serverError ? (
            <Alert tone="error" title="Račun nije otvoren">
              {serverError}
            </Alert>
          ) : null}

          <TextField
            label="Ime i prezime"
            autoComplete="name"
            required
            error={errors.fullName?.message}
            {...register('fullName')}
          />

          <TextField
            label="E-mail"
            type="email"
            autoComplete="email"
            required
            error={errors.email?.message}
            {...register('email')}
          />

          <TextField
            label="Telefon"
            type="tel"
            autoComplete="tel"
            hint="Neobavezno, ali korisno ako vas trebamo nazvati zbog termina."
            error={errors.phone?.message}
            {...register('phone')}
          />

          <TextField
            label="Lozinka"
            type="password"
            autoComplete="new-password"
            required
            hint="Najmanje 8 znakova, barem jedno slovo i jedna znamenka."
            error={errors.password?.message}
            {...register('password')}
          />

          <HoneypotField register={register('website')} />

          <Button type="submit" fullWidth size="lg" loading={isSubmitting}>
            Otvori račun
          </Button>

          <p className="text-sm text-asphalt-500">
            Otvaranjem računa prihvaćate{' '}
            <Link to="/uvjeti" className="font-semibold text-midnight-800">
              uvjete korištenja
            </Link>{' '}
            i{' '}
            <Link to="/privatnost" className="font-semibold text-midnight-800">
              politiku privatnosti
            </Link>
            .
          </p>
        </form>
      </div>
    </Section>
  );
}
