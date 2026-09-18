import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth, homeRouteFor } from './useAuth';
import type { RoleName } from '@/lib/types';
import { LoadingRows } from '@/components/ui/Feedback';

/**
 * Zaštita ruta na klijentu je samo udobnost — pravu kontrolu radi backend.
 * Ako bi netko zaobišao ovu provjeru, API bi i dalje vratio 403 ili 404.
 */
export function RequireAuth({ roles }: { roles?: RoleName[] }) {
  const { user, isLoading, hasRole } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-16">
        <LoadingRows rows={3} />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/prijava" state={{ from: location.pathname }} replace />;
  }

  if (roles && !hasRole(...roles)) {
    return <Navigate to={homeRouteFor(user)} replace />;
  }

  return <Outlet />;
}
