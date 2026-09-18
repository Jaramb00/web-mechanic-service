import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SlotBoard } from './SlotBoard';
import type { SlotView } from '@/lib/types';

const SLOTS: SlotView[] = [
  { startAt: '2026-09-19T06:00:00Z', endAt: '2026-09-19T06:30:00Z', available: true, freeBays: 2 },
  { startAt: '2026-09-19T06:30:00Z', endAt: '2026-09-19T07:00:00Z', available: false, freeBays: 0 },
  { startAt: '2026-09-19T07:00:00Z', endAt: '2026-09-19T07:30:00Z', available: true, freeBays: 1 },
];

describe('tabla termina', () => {
  it('nudi samo slobodne termine kao gumbe, a zauzete i dalje prikazuje', () => {
    render(<SlotBoard slots={SLOTS} label="Termini" />);

    // Dva slobodna termina su gumbi; zauzeti se vidi, ali se ne može odabrati.
    expect(screen.getAllByRole('button')).toHaveLength(2);
    expect(screen.getByText('08:30')).toBeInTheDocument();
  });

  it('odabirom termina javlja točno vrijeme koje je korisnik stisnuo', async () => {
    const onSelect = vi.fn();
    render(<SlotBoard slots={SLOTS} onSelect={onSelect} label="Termini" />);

    await userEvent.click(screen.getAllByRole('button')[0]);

    expect(onSelect).toHaveBeenCalledWith('2026-09-19T06:00:00Z');
  });

  it('odabrani termin označava i za čitače ekrana, ne samo bojom', async () => {
    const { rerender } = render(<SlotBoard slots={SLOTS} label="Termini" />);
    rerender(<SlotBoard slots={SLOTS} selected="2026-09-19T06:00:00Z" label="Termini" />);

    expect(screen.getAllByRole('button')[0]).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getAllByRole('button')[1]).toHaveAttribute('aria-pressed', 'false');
  });

  it('strelicama pomiče fokus preko zauzetog termina na sljedeći slobodan', async () => {
    render(<SlotBoard slots={SLOTS} label="Termini" />);
    const buttons = screen.getAllByRole('button');

    buttons[0].focus();
    await userEvent.keyboard('{ArrowRight}');

    // Zauzeti termin se preskače — nema smisla zaustavljati se na njemu.
    expect(buttons[1]).toHaveFocus();
  });

  it('u načinu samo za čitanje ne nudi nijedan gumb', () => {
    render(<SlotBoard slots={SLOTS} readOnly label="Termini" />);

    expect(screen.queryAllByRole('button')).toHaveLength(0);
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
  });
});
