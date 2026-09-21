import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useReveal } from './reveal';

/**
 * Ovi testovi ne provjeravaju animaciju nego njezin JEDINI ozbiljan kvar:
 * da sadržaj ostane nevidljiv.
 *
 * `.reveal` postavlja `opacity: 0`, a vraća ga tek klasa `.reveal-in`. Ako
 * promatrač ne postoji, ne pokrene se, ili korisnik ima isključene animacije,
 * a klasa se ne doda — cijela sekcija stranice jednostavno nestane. Zato se
 * svaki od tih putova provjerava zasebno.
 */
function Probe() {
  const ref = useReveal<HTMLDivElement>();
  return (
    <div ref={ref} className="reveal" data-testid="sekcija">
      sadržaj
    </div>
  );
}

const originalIO = window.IntersectionObserver;
const originalMatchMedia = window.matchMedia;

afterEach(() => {
  window.IntersectionObserver = originalIO;
  window.matchMedia = originalMatchMedia;
  vi.restoreAllMocks();
});

function mockMatchMedia(reduced: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: reduced,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

describe('useReveal', () => {
  it('otkriva sadržaj odmah kad preglednik nema IntersectionObserver', () => {
    mockMatchMedia(false);
    // @ts-expect-error — namjerno se uklanja da se provjeri zamjenski put
    delete window.IntersectionObserver;

    render(<Probe />);
    expect(screen.getByTestId('sekcija')).toHaveClass('reveal-in');
  });

  it('otkriva sadržaj odmah kad su animacije isključene', () => {
    mockMatchMedia(true);
    const observe = vi.fn();
    class FakeObserver {
      observe = observe;
      unobserve = vi.fn();
      disconnect = vi.fn();
      takeRecords = () => [];
      root = null;
      rootMargin = '';
      thresholds: number[] = [];
    }
    window.IntersectionObserver = FakeObserver as unknown as typeof IntersectionObserver;

    render(<Probe />);

    expect(screen.getByTestId('sekcija')).toHaveClass('reveal-in');
    // Promatrač se u ovom slučaju uopće ne smije pokrenuti.
    expect(observe).not.toHaveBeenCalled();
  });

  it('otkriva sadržaj kad element uđe u kadar i prestaje ga pratiti', () => {
    mockMatchMedia(false);
    let notify: ((entries: IntersectionObserverEntry[]) => void) | undefined;
    const unobserve = vi.fn();

    // Razred, a ne vi.fn koji vraća objekt: hook poziva `new`, pa mu treba
    // pravi konstruktor.
    class FakeObserver {
      constructor(callback: IntersectionObserverCallback) {
        notify = callback as unknown as (entries: IntersectionObserverEntry[]) => void;
      }
      observe = vi.fn();
      unobserve = unobserve;
      disconnect = vi.fn();
      takeRecords = () => [];
      root = null;
      rootMargin = '';
      thresholds: number[] = [];
    }
    window.IntersectionObserver = FakeObserver as unknown as typeof IntersectionObserver;

    render(<Probe />);
    const element = screen.getByTestId('sekcija');
    expect(element).not.toHaveClass('reveal-in');

    notify!([{ isIntersecting: true, target: element } as unknown as IntersectionObserverEntry]);

    expect(element).toHaveClass('reveal-in');
    // Jednom otkriven sadržaj ostaje vidljiv — nema ponovnog skrivanja pri
    // scrollu prema gore, jer to smeta čitanju.
    expect(unobserve).toHaveBeenCalledWith(element);
  });
});
