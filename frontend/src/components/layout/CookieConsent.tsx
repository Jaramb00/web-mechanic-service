import { useState } from 'react';
import { Link } from 'react-router-dom';
import { readConsent, storeConsent } from '@/lib/analytics';
import { Button } from '@/components/ui/Button';

/**
 * Pristanak na kolačiće.
 *
 * Do pristanka se ne učitava nijedna skripta treće strane — banner ne krije
 * mjerenje koje već teče. Kolačić prijave nije obuhvaćen jer je nužan za rad
 * usluge i ne traži pristanak.
 */
export function CookieConsent() {
  const [decision, setDecision] = useState(() => readConsent());

  if (decision !== null) return null;

  function decide(value: 'accepted' | 'rejected') {
    storeConsent(value);
    setDecision(value);
  }

  return (
    <div
      role="dialog"
      aria-labelledby="kolacici-naslov"
      className="fixed inset-x-0 bottom-0 z-40 border-t-4 border-work-500 bg-ink-950 px-4 py-4 text-white"
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 lg:flex-row lg:items-center">
        <div className="min-w-0 flex-1">
          <h2 id="kolacici-naslov" className="text-base font-bold">
            Kolačići
          </h2>
          <p className="mt-1 max-w-prose text-sm text-ink-200">
            Koristimo samo kolačiće nužne za rad prijave i rezervacije. Mjerenje posjeta
            uključujemo isključivo uz vaš pristanak. Više u{' '}
            <Link to="/privatnost" className="font-semibold text-work-400 underline">
              politici privatnosti
            </Link>
            .
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button variant="ghost" className="text-white hover:bg-ink-900" onClick={() => decide('rejected')}>
            Samo nužni
          </Button>
          <Button onClick={() => decide('accepted')}>Prihvaćam sve</Button>
        </div>
      </div>
    </div>
  );
}
