import { useEffect, useRef } from 'react';

/**
 * ULAZ U KADAR — element se pojavi kad dođe u vidno polje.
 *
 * Namjerno bez animacijske biblioteke: jedan IntersectionObserver i dvije CSS
 * klase (`.reveal` / `.reveal-in`, definirane u theme.css) rade posao za koji
 * bi inače u bundle ušlo 30-ak kB.
 *
 * Tri stvari koje ovdje moraju biti točne, jer se inače sadržaj izgubi:
 *
 *  1. Promatranje prestaje nakon prvog ulaska. Element koji je jednom ušao
 *     ostaje vidljiv — ponovno skrivanje pri scrollu prema gore je efekt koji
 *     smeta čitanju.
 *  2. Ako preglednik nema IntersectionObserver, sadržaj se odmah otkriva.
 *     Nevidljiv sadržaj je gori kvar od izostale animacije.
 *  3. Korisnik s `prefers-reduced-motion` dobiva sadržaj odmah; CSS to
 *     pokriva i sam, ali ovdje preskačemo i promatrača.
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reducedMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reducedMotion || typeof IntersectionObserver === 'undefined') {
      el.classList.add('reveal-in');
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add('reveal-in');
          observer.unobserve(entry.target);
        }
      },
      // Otkrivanje kreće malo prije nego što element stvarno uđe, da pokret
      // bude gotov dok ga korisnik pogleda, a ne da se odvija pred njim.
      { rootMargin: '0px 0px -10% 0px', threshold: 0.05 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return ref;
}
