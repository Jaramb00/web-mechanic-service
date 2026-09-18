import { useEffect } from 'react';
import { site } from '@/config/site';

type Seo = {
  title: string;
  description: string;
  path: string;
  /** Stranice koje ne pripadaju tražilici (portali, prijava). */
  noIndex?: boolean;
};

function upsertMeta(selector: string, attribute: 'name' | 'property', key: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

/**
 * Postavlja naslov, opis, canonical i Open Graph podatke po ruti.
 *
 * DEMO: aplikacija je SPA, pa ovo radi tek nakon izvršavanja JavaScripta.
 * Google to danas obrađuje, ali za ozbiljan SEO u produkciji treba
 * prerender ili SSR — zabilježeno u docs/OPEN-QUESTIONS.md.
 */
export function useSeo({ title, description, path, noIndex = false }: Seo): void {
  useEffect(() => {
    const fullTitle = `${title} | ${site.name}`;
    document.title = fullTitle;

    upsertMeta('meta[name="description"]', 'name', 'description', description);
    upsertMeta('meta[name="robots"]', 'name', 'robots', noIndex ? 'noindex, nofollow' : 'index, follow');
    upsertMeta('meta[property="og:title"]', 'property', 'og:title', fullTitle);
    upsertMeta('meta[property="og:description"]', 'property', 'og:description', description);
    upsertMeta('meta[property="og:url"]', 'property', 'og:url', `${site.url}${path}`);

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = `${site.url}${path}`;
  }, [title, description, path, noIndex]);
}
