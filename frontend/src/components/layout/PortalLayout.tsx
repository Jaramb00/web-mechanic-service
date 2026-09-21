import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/cn';
import { site } from '@/config/site';
import { useAuth } from '@/features/auth/useAuth';
import { Button } from '@/components/ui/Button';
import { Logout } from '@/components/ui/Icon';
import { DemoRibbon } from './DemoRibbon';
import { NotificationBell } from '@/features/notifications/NotificationBell';

export type PortalNavItem = { to: string; label: string; end?: boolean };

/**
 * Okvir portala (kupac, majstor, skladište, administracija).
 *
 * Navigacija je vodoravna traka, ne bočni izbornik: majstor radi na tabletu u
 * vodoravnom položaju, gdje bočni izbornik jede širinu koja treba tablici
 * naloga. Traka se na uskom ekranu vodoravno skrola i ostaje dohvatljiva palcem.
 */
export function PortalLayout({ title, nav }: { title: string; nav: PortalNavItem[] }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/');
  }

  return (
    <div className="flex min-h-screen flex-col bg-asphalt-50">
      <a
        href="#portal-sadrzaj"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-plate focus:bg-volt-500 focus:px-4 focus:py-2 focus:font-bold focus:text-asphalt-950"
      >
        Prijeđi na sadržaj
      </a>

      <DemoRibbon />

      <header className="on-midnight border-b-4 border-volt-500 bg-asphalt-950 text-white">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
          <Link to="/" className="text-sm font-bold text-asphalt-300 no-underline hover:text-white">
            {site.name}
          </Link>
          <span aria-hidden="true" className="text-asphalt-500">
            /
          </span>
          <h1 className="text-lg font-extrabold tracking-tight">{title}</h1>

          <div className="ml-auto flex items-center gap-3">
            <NotificationBell />
            <span className="hidden text-sm text-asphalt-300 sm:inline">{user?.fullName}</span>
            <Button variant="ghost" size="sm" className="text-white hover:bg-asphalt-900" onClick={handleLogout}>
              <Logout size={18} />
              Odjava
            </Button>
          </div>
        </div>

        <nav aria-label="Navigacija portala" className="border-t border-asphalt-900">
          <ul className="mx-auto flex w-full max-w-7xl gap-1 overflow-x-auto px-2">
            {nav.map((item) => (
              <li key={item.to} className="shrink-0">
                <NavLink
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    cn(
                      'block whitespace-nowrap border-b-4 px-3 py-3 text-sm font-semibold no-underline transition-colors duration-100',
                      isActive
                        ? 'border-volt-500 text-white'
                        : 'border-transparent text-asphalt-300 hover:text-white',
                    )
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <main id="portal-sadrzaj" className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}

/** Naslov sekcije unutar portala, s mjestom za radnju s desne strane. */
export function SectionHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-xl font-extrabold tracking-tight text-asphalt-950">{title}</h2>
        {description ? <p className="mt-1 text-[0.9375rem] text-asphalt-500">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}
