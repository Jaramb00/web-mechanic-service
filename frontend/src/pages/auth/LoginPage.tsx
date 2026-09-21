import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSeo } from '@/lib/seo';
import { useAuth, homeRouteFor } from '@/features/auth/useAuth';
import { errorMessage } from '@/features/public/queries';
import { Section } from '@/components/ui/Section';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/Field';
import { Alert } from '@/components/ui/Feedback';
import { DemoAccounts } from './DemoAccounts';

export function LoginPage() {
  useSeo({
    title: 'Prijava',
    description: 'Prijavite se u svoj račun da biste vidjeli i rezervirali termine.',
    path: '/prijava',
    noIndex: true,
  });

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setPending(true);
    try {
      const user = await login({ email, password });
      navigate(from ?? homeRouteFor(user), { replace: true });
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setPending(false);
    }
  }

  return (
    <Section tone="light">
      <div className="mx-auto max-w-md">
        <h1 className="display text-3xl sm:text-4xl">Prijava</h1>
        <p className="mt-2 text-[1.0625rem] text-asphalt-700">
          Nemate račun?{' '}
          <Link to="/registracija" className="font-bold text-midnight-800">
            Otvorite ga u minuti
          </Link>
          .
        </p>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="mt-6 space-y-4 rounded-card border border-asphalt-200 shadow-plate bg-white p-5 sm:p-6"
        >
          {error ? (
            <Alert tone="error" title="Prijava nije uspjela">
              {error}
            </Alert>
          ) : null}

          <TextField
            label="E-mail"
            type="email"
            name="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />

          <TextField
            label="Lozinka"
            type="password"
            name="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />

          <Button type="submit" fullWidth size="lg" loading={pending}>
            Prijavi se
          </Button>
        </form>

        <DemoAccounts />
      </div>
    </Section>
  );
}
