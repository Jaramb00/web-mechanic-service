import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils';
import { AuthProvider } from '@/features/auth/AuthContext';
import { LoginPage } from './LoginPage';
import { ApiError, api } from '@/lib/api';

vi.mock('@/lib/api', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api')>('@/lib/api');
  return { ...actual, api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), del: vi.fn() } };
});

const mockedApi = vi.mocked(api);

function renderPage() {
  return renderWithProviders(
    <AuthProvider>
      <LoginPage />
    </AuthProvider>,
  );
}

describe('obrazac za prijavu', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedApi.get.mockResolvedValue(undefined);
  });

  it('šalje upisane podatke na prijavu', async () => {
    mockedApi.post.mockResolvedValue({
      id: 4, email: 'ivan@demo.local', fullName: 'Ivan', roles: ['CUSTOMER'],
    });
    renderPage();

    await userEvent.type(screen.getByLabelText(/E-mail/), 'ivan@demo.local');
    await userEvent.type(screen.getByLabelText(/Lozinka/), 'Demo1234!');
    await userEvent.click(screen.getByRole('button', { name: 'Prijavi se' }));

    await waitFor(() =>
      expect(mockedApi.post).toHaveBeenCalledWith('/api/auth/login', {
        email: 'ivan@demo.local',
        password: 'Demo1234!',
      }),
    );
  });

  it('neuspjelu prijavu objašnjava korisniku', async () => {
    mockedApi.post.mockRejectedValue(
      new ApiError(401, 'Niste prijavljeni', 'Neispravan e-mail ili lozinka.'),
    );
    renderPage();

    await userEvent.type(screen.getByLabelText(/E-mail/), 'ivan@demo.local');
    await userEvent.type(screen.getByLabelText(/Lozinka/), 'krivo');
    await userEvent.click(screen.getByRole('button', { name: 'Prijavi se' }));

    await waitFor(() => {
      expect(screen.getByText('Neispravan e-mail ili lozinka.')).toBeInTheDocument();
    });
  });

  it('mrežni ispad ne ostavlja korisnika bez poruke', async () => {
    mockedApi.post.mockRejectedValue(
      new ApiError(0, 'Nema veze s poslužiteljem', 'Provjerite internetsku vezu i pokušajte ponovno.'),
    );
    renderPage();

    await userEvent.type(screen.getByLabelText(/E-mail/), 'ivan@demo.local');
    await userEvent.type(screen.getByLabelText(/Lozinka/), 'Demo1234!');
    await userEvent.click(screen.getByRole('button', { name: 'Prijavi se' }));

    await waitFor(() => {
      expect(screen.getByText(/Provjerite internetsku vezu/)).toBeInTheDocument();
    });
  });

  it('lozinka se ne prikazuje u čitljivom obliku', () => {
    renderPage();
    expect(screen.getByLabelText(/Lozinka/)).toHaveAttribute('type', 'password');
  });
});
