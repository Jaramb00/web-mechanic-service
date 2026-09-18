import type { ReactNode } from 'react';

/**
 * Tipografija pravnih stranica.
 *
 * Mod je „čitanje": širina retka je ograničena na oko 68 znakova, jer je to
 * raspon u kojem oko lako nalazi početak sljedećeg retka.
 */
export function LegalBody({ children }: { children: ReactNode }) {
  return (
    <div
      className="
        mt-8 max-w-[68ch] text-[1.0625rem] leading-relaxed text-ink-700
        [&_h2]:mb-2 [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-extrabold [&_h2]:tracking-tight [&_h2]:text-ink-950
        [&_p]:mb-4
        [&_ul]:mb-4 [&_ul]:space-y-2 [&_ul]:pl-5
        [&_li]:list-disc [&_li]:marker:text-signal-700
        [&_strong]:text-ink-950
        [&_em]:font-semibold [&_em]:not-italic [&_em]:text-stop-600
      "
    >
      {children}
    </div>
  );
}
