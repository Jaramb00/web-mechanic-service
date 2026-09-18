import { Suspense, lazy, useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { RequireAuth } from '@/features/auth/guards';
import { LoadingRows } from '@/components/ui/Feedback';

import { HomePage } from '@/pages/public/HomePage';
import { ServicesPage } from '@/pages/public/ServicesPage';
import { PricingPage } from '@/pages/public/PricingPage';
import { TireStoragePage } from '@/pages/public/TireStoragePage';
import { AboutPage } from '@/pages/public/AboutPage';
import { ContactPage } from '@/pages/public/ContactPage';
import { LocationPage } from '@/pages/public/LocationPage';
import { FaqPage } from '@/pages/public/FaqPage';
import { PrivacyPage } from '@/pages/public/PrivacyPage';
import { TermsPage } from '@/pages/public/TermsPage';
import { NotFoundPage } from '@/pages/public/NotFoundPage';
import { BookingPage } from '@/pages/public/BookingPage';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { CatalogPage } from '@/pages/public/CatalogPage';

/* Portali se učitavaju lijeno: posjetitelj javne stranice ne treba njihov kod. */
const CustomerOverview = lazy(() => import('@/pages/customer/CustomerOverview'));
const CustomerVehicles = lazy(() => import('@/pages/customer/CustomerVehicles'));
const CustomerAppointments = lazy(() => import('@/pages/customer/CustomerAppointments'));
const CustomerReservations = lazy(() => import('@/pages/customer/CustomerReservations'));
const NotificationsPage = lazy(() => import('@/pages/shared/NotificationsPage'));
const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard'));
const AdminAppointments = lazy(() => import('@/pages/admin/AdminAppointments'));
const AdminUsers = lazy(() => import('@/pages/admin/AdminUsers'));
const AdminServices = lazy(() => import('@/pages/admin/AdminServices'));
const AdminWorkingHours = lazy(() => import('@/pages/admin/AdminWorkingHours'));
const WorkBoard = lazy(() => import('@/pages/employee/WorkBoard'));
const WarehouseStock = lazy(() => import('@/pages/warehouse/WarehouseStock'));
const WarehouseMovements = lazy(() => import('@/pages/warehouse/WarehouseMovements'));
const WarehouseReservations = lazy(() => import('@/pages/warehouse/WarehouseReservations'));

const CUSTOMER_NAV = [
  { to: '/moj-racun', label: 'Pregled', end: true },
  { to: '/moj-racun/termini', label: 'Moji termini' },
  { to: '/moj-racun/vozila', label: 'Moja vozila' },
  { to: '/moj-racun/rezervacije', label: 'Rezervacije artikala' },
];

const ADMIN_NAV = [
  { to: '/admin', label: 'Pregled dana', end: true },
  { to: '/admin/termini', label: 'Termini' },
  { to: '/admin/usluge', label: 'Usluge i cjenik' },
  { to: '/admin/korisnici', label: 'Korisnici' },
  { to: '/admin/radno-vrijeme', label: 'Radno vrijeme' },
  { to: '/skladiste', label: 'Skladište' },
];

const EMPLOYEE_NAV = [{ to: '/radionica', label: 'Radni nalozi', end: true }];

const WAREHOUSE_NAV = [
  { to: '/skladiste', label: 'Zaliha', end: true },
  { to: '/skladiste/promet', label: 'Promet' },
  { to: '/skladiste/rezervacije', label: 'Rezervacije' },
];

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function PortalFallback() {
  return <LoadingRows rows={4} />;
}

export function App() {
  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<PortalFallback />}>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route index element={<HomePage />} />
            <Route path="usluge" element={<ServicesPage />} />
            <Route path="cjenik" element={<PricingPage />} />
            <Route path="hotel-za-gume" element={<TireStoragePage />} />
            <Route path="ponuda-guma" element={<CatalogPage />} />
            <Route path="o-nama" element={<AboutPage />} />
            <Route path="kontakt" element={<ContactPage />} />
            <Route path="lokacija" element={<LocationPage />} />
            <Route path="cesta-pitanja" element={<FaqPage />} />
            <Route path="rezervacija" element={<BookingPage />} />
            <Route path="privatnost" element={<PrivacyPage />} />
            <Route path="uvjeti" element={<TermsPage />} />
            <Route path="prijava" element={<LoginPage />} />
            <Route path="registracija" element={<RegisterPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>

          <Route element={<RequireAuth roles={['CUSTOMER']} />}>
            <Route element={<PortalLayout title="Moj račun" nav={CUSTOMER_NAV} />}>
              <Route path="moj-racun" element={<CustomerOverview />} />
              <Route path="moj-racun/termini" element={<CustomerAppointments />} />
              <Route path="moj-racun/vozila" element={<CustomerVehicles />} />
              <Route path="moj-racun/rezervacije" element={<CustomerReservations />} />
            </Route>
          </Route>

          <Route element={<RequireAuth />}>
            <Route element={<PortalLayout title="Obavijesti" nav={[]} />}>
              <Route path="obavijesti" element={<NotificationsPage />} />
            </Route>
          </Route>

          <Route element={<RequireAuth roles={['ADMIN']} />}>
            <Route element={<PortalLayout title="Administracija" nav={ADMIN_NAV} />}>
              <Route path="admin" element={<AdminDashboard />} />
              <Route path="admin/termini" element={<AdminAppointments />} />
              <Route path="admin/usluge" element={<AdminServices />} />
              <Route path="admin/korisnici" element={<AdminUsers />} />
              <Route path="admin/radno-vrijeme" element={<AdminWorkingHours />} />
            </Route>
          </Route>

          <Route element={<RequireAuth roles={['EMPLOYEE', 'ADMIN']} />}>
            <Route element={<PortalLayout title="Radionica" nav={EMPLOYEE_NAV} />}>
              <Route path="radionica" element={<WorkBoard />} />
            </Route>
          </Route>

          <Route element={<RequireAuth roles={['WAREHOUSE_WORKER', 'ADMIN']} />}>
            <Route element={<PortalLayout title="Skladište" nav={WAREHOUSE_NAV} />}>
              <Route path="skladiste" element={<WarehouseStock />} />
              <Route path="skladiste/promet" element={<WarehouseMovements />} />
              <Route path="skladiste/rezervacije" element={<WarehouseReservations />} />
            </Route>
          </Route>
        </Routes>
      </Suspense>
    </>
  );
}
