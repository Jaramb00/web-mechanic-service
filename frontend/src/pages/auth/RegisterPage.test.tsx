import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils';
import { AuthProvider } from '@/features/auth/AuthContext';
import { RegisterPage } from './RegisterPage';
import { ApiError, api } from '@/lib/api';

vi.mock('@/lib/api', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api')>('@/lib/api');
  return {
    ...actual,
    api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), del: vi.fn() },
  };
});

const mockedApi = vi.mocked(api);

function renderPage() {
  return renderWithProviders(
    <AuthProvider>
      <RegisterPage />
    </AuthProvider>,
  );
}

describe('obrazac za otvaranje računa', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Nitko nije prijavljen: backend na /me vraća prazno tijelo.
    mockedApi.get.mockResolvedValue(undefined);
  });

  it('prazan obrazac ne šalje ništa na poslužitelj', async () => {
    renderPage();

    await userEvent.click(screen.getByRole('button', { name: 'Otvori račun' }));

    await waitFor(() => {
      expect(screen.getByText('Upišite ime i prezime.')).toBeInTheDocument();
    });
    expect(mockedApi.post).not.toHaveBeenCalled();
  });

  it('javlja koja je greška u kojem polju, a ne samo „neispravan unos"', async () => {
    renderPage();

    await userEvent.type(screen.getByLabelText(/Ime i prezime/), 'Ivan Horvat');
    await userEvent.type(screen.getByLabelText(/E-mail/), 'ovo-nije-email');
    await userEvent.type(screen.getByLabelText(/Lozinka/), 'kratka');
    await userEvent.click(screen.getByRole('button', { name: 'Otvori račun' }));

    await waitFor(() => {
      expect(screen.getByText('E-mail nije ispravnog oblika.')).toBeInTheDocument();
    });
    expect(screen.getByText('Lozinka mora imati barem 8 znakova.')).toBeInTheDocument();
    expect(mockedApi.post).not.toHaveBeenCalled();
  });

  it('traži znamenku u lozinci', async () => {
    renderPage();

    await userEvent.type(screen.getByLabelText(/Ime i prezime/), 'Ivan Horvat');
    await userEvent.type(screen.getByLabelText(/E-mail/), 'ivan@primjer.hr');
    await userEvent.type(screen.getByLabelText(/Lozinka/), 'samoslova');
    await userEvent.click(screen.getByRole('button', { name: 'Otvori račun' }));

    await waitFor(() => {
      expect(screen.getByText('Lozinka mora sadržavati barem jednu znamenku.')).toBeInTheDocument();
    });
  });

  it('ispravan obrazac šalje zahtjev i ne šalje polje uloge', async () => {
    mockedApi.post.mockResolvedValue({
      id: 1,
      email: 'ivan@primjer.hr',
      fullName: 'Ivan Horvat',
      roles: ['CUSTOMER'],
    });
    renderPage();

    await userEvent.type(screen.getByLabelText(/Ime i prezime/), 'Ivan Horvat');
    await userEvent.type(screen.getByLabelText(/E-mail/), 'ivan@primjer.hr');
    await userEvent.type(screen.getByLabelText(/Lozinka/), 'Lozinka123');
    await userEvent.click(screen.getByRole('button', { name: 'Otvori račun' }));

    await waitFor(() => expect(mockedApi.post).toHaveBeenCalledTimes(1));
    const [path, body] = mockedApi.post.mock.calls[0];
    expect(path).toBe('/api/auth/register');
    // Uloga se dodjeljuje na poslužitelju; klijent je ne smije ni spominjati.
    expect(body).not.toHaveProperty('role');
    expect(body).toMatchObject({ email: 'ivan@primjer.hr', website: '' });
  });

  it('grešku s poslužitelja prikazuje korisniku, a ne guta u konzolu', async () => {
    mockedApi.post.mockRejectedValue(
      new ApiError(409, 'Sukob', 'Korisnik s tom e-mail adresom već postoji.'),
    );
    renderPage();

    await userEvent.type(screen.getByLabelText(/Ime i prezime/), 'Ivan Horvat');
    await userEvent.type(screen.getByLabelText(/E-mail/), 'ivan@primjer.hr');
    await userEvent.type(screen.getByLabelText(/Lozinka/), 'Lozinka123');
    await userEvent.click(screen.getByRole('button', { name: 'Otvori račun' }));

    await waitFor(() => {
      expect(screen.getByText('Korisnik s tom e-mail adresom već postoji.')).toBeInTheDocument();
    });
  });
});
