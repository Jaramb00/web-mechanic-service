import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Alert, EmptyState, ErrorState } from './Feedback';

describe('stanja sučelja', () => {
  it('greška se objavljuje čitačima ekrana odmah, kao alert', () => {
    render(<Alert tone="error" title="Greška">Nešto je pošlo po zlu.</Alert>);
    expect(screen.getByRole('alert')).toHaveTextContent('Nešto je pošlo po zlu.');
  });

  it('obavijest se objavljuje nenametljivo, kao status', () => {
    render(<Alert tone="success">Spremljeno.</Alert>);
    expect(screen.getByRole('status')).toHaveTextContent('Spremljeno.');
  });

  it('prazno stanje objašnjava zašto je prazno i nudi sljedeći korak', () => {
    render(
      <EmptyState
        title="Nemate termina"
        description="Kad rezervirate termin, pojavit će se ovdje."
        action={<button type="button">Rezerviraj</button>}
      />,
    );
    expect(screen.getByRole('heading', { name: 'Nemate termina' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Rezerviraj' })).toBeInTheDocument();
  });

  it('greška pri dohvaćanju uvijek nudi ponovni pokušaj', async () => {
    const onRetry = vi.fn();
    render(<ErrorState message="Podaci se nisu učitali." onRetry={onRetry} />);

    await userEvent.click(screen.getByRole('button', { name: 'Pokušaj ponovno' }));
    expect(onRetry).toHaveBeenCalledOnce();
  });
});
