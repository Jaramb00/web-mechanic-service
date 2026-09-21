import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { cn } from '@/lib/cn';
import { site, fullAddress } from '@/config/site';
import { useAuth, homeRouteFor } from '@/features/auth/useAuth';
import { Menu, Phone, User, X } from '@/components/ui/Icon';
import { ButtonLink } from '@/components/ui/Button';
import { CookieConsent } from './CookieConsent';
import { DemoRibbon } from './DemoRibbon';

const NAV = [
  { to: '/usluge', label: 'Usluge' },
  { to: '/cjenik', label: 'Cjenik' },
  { to: '/hotel-za-gume', label: 'Hotel za gume' },
  { to: '/o-nama', label: 'O nama' },
  { to: '/kontakt', label: 'Kontakt' },
];

export function PublicLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col bg-asphalt-50">
      <a
        href="#glavni-sadrzaj"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-plate focus:bg-volt-500 focus:px-4 focus:py-2 focus:font-bold focus:text-asphalt-950"
      >
        Prijeđi na sadržaj
      </a>

      <DemoRibbon />

      <header className="on-midnight sticky top-0 z-30 border-b-4 border-asphalt-950 bg-midnight-800 text-white">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-4 px-4 py-3">
          <Link
            to="/"
            className="flex min-w-0 items-center gap-2.5 no-underline"
            aria-label={`${site.name} — naslovnica`}
          >
            <SignMark />
            <span className="truncate text-lg font-extrabold leading-none tracking-tight text-white sm:text-xl">
              {site.name}
            </span>
          </Link>

          <nav aria-label="Glavna navigacija" className="ml-auto hidden lg:block">
            <ul className="flex items-center gap-1">
              {NAV.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    className={({ isActive }) =>
                      cn(
                        'block rounded-plate px-3 py-2 text-[0.9375rem] font-semibold no-underline transition-colors duration-100',
                        isActive
                          ? 'bg-midnight-950 text-white'
                          : 'text-midnight-100 hover:bg-midnight-700 hover:text-white',
                      )
                    }
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className="ml-auto flex items-center gap-2 lg:ml-0">
            <a
              href={site.contact.phoneHref}
              className="hidden items-center gap-2 rounded-plate px-3 py-2 font-bold text-white no-underline hover:bg-midnight-700 sm:flex"
            >
              <Phone size={18} />
              {site.contact.phone}
            </a>
            {/* Sakriva se omotač: `hidden` na samom gumbu bi se sudario s
                `inline-flex` iz njegove bazne klase i izgubio po redoslijedu
                pravila, pa bi gumb ostao vidljiv i gurao zaglavlje u širinu. */}
            <span className="hidden sm:block">
              <ButtonLink to="/rezervacija" size="sm">
                Rezerviraj termin
              </ButtonLink>
            </span>
            <Link
              to={user ? homeRouteFor(user) : '/prijava'}
              className="flex min-h-11 min-w-11 items-center justify-center rounded-plate text-white no-underline hover:bg-midnight-700"
              aria-label={user ? 'Moj račun' : 'Prijava'}
            >
              <User size={22} />
            </Link>
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-controls="mobilni-izbornik"
              aria-label={menuOpen ? 'Zatvori izbornik' : 'Otvori izbornik'}
              className="flex min-h-11 min-w-11 items-center justify-center rounded-plate text-white hover:bg-midnight-700 lg:hidden"
            >
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {menuOpen ? (
          <nav
            id="mobilni-izbornik"
            aria-label="Izbornik"
            className="border-t-2 border-midnight-950 bg-midnight-900 lg:hidden"
          >
            <ul className="mx-auto w-full max-w-6xl px-4 py-2">
              {NAV.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    className={({ isActive }) =>
                      cn(
                        'block border-b border-midnight-800 py-3 text-base font-semibold no-underline last:border-b-0',
                        isActive ? 'text-volt-400' : 'text-white',
                      )
                    }
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
              <li className="py-3">
                <ButtonLink to="/rezervacija" fullWidth>
                  Rezerviraj termin
                </ButtonLink>
              </li>
            </ul>
          </nav>
        ) : null}
      </header>

      <main id="glavni-sadrzaj" className="flex-1">
        <Outlet />
      </main>

      <PublicFooter />
      <CookieConsent />
    </div>
  );
}

/** Znak servisa: plava ploha s uvučenom bijelom konturom i gumom u sredini. */
function SignMark() {
  return (
    <span
      aria-hidden="true"
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-plate bg-white"
    >
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#0b4c8c" strokeWidth="2">
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="3.4" />
        <path d="M12 3v2.4M12 18.6V21M3 12h2.4M18.6 12H21" strokeLinecap="round" />
      </svg>
    </span>
  );
}

function PublicFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="on-midnight border-t-4 border-volt-500 bg-asphalt-950 text-asphalt-200">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-base font-extrabold text-white">{site.name}</p>
          <p className="mt-2 text-sm leading-relaxed">{site.tagline}</p>
        </div>

        <div>
          <h2 className="text-sm font-bold uppercase tracking-wide text-volt-400">Kontakt</h2>
          <ul className="mt-3 space-y-1.5 text-sm">
            <li>
              <a href={site.contact.phoneHref} className="text-asphalt-200 hover:text-white">
                {site.contact.phone}
              </a>
            </li>
            <li>
              <a href={`mailto:${site.contact.email}`} className="text-asphalt-200 hover:text-white">
                {site.contact.email}
              </a>
            </li>
            <li>{fullAddress}</li>
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-bold uppercase tracking-wide text-volt-400">Servis</h2>
          <ul className="mt-3 space-y-1.5 text-sm">
            <li><FooterLink to="/usluge">Usluge</FooterLink></li>
            <li><FooterLink to="/cjenik">Cjenik</FooterLink></li>
            <li><FooterLink to="/hotel-za-gume">Hotel za gume</FooterLink></li>
            <li><FooterLink to="/lokacija">Lokacija</FooterLink></li>
            <li><FooterLink to="/cesta-pitanja">Česta pitanja</FooterLink></li>
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-bold uppercase tracking-wide text-volt-400">Pravno</h2>
          <ul className="mt-3 space-y-1.5 text-sm">
            <li><FooterLink to="/privatnost">Politika privatnosti</FooterLink></li>
            <li><FooterLink to="/uvjeti">Uvjeti korištenja</FooterLink></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-asphalt-900">
        <p className="mx-auto w-full max-w-6xl px-4 py-4 text-xs text-asphalt-300">
          © {year} {site.legalName} · OIB {site.oib} · Demo verzija — podaci o tvrtki su
          zamjenski i moraju se zamijeniti stvarnima prije objave.
        </p>
      </div>
    </footer>
  );
}

function FooterLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link to={to} className="text-asphalt-200 no-underline hover:text-white hover:underline">
      {children}
    </Link>
  );
}
