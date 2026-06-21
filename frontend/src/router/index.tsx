import { Navigate, Outlet, createBrowserRouter } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import AppLayout from '../components/layout/AppLayout';
import LoginPage from '../pages/auth/LoginPage';
import ChangePasswordPage from '../pages/auth/ChangePasswordPage';
import SelectCondominiumPage from '../pages/auth/SelectCondominiumPage';
import DashboardPage from '../pages/dashboard/DashboardPage';
import AccessPage from '../pages/access/AccessPage';
import ResidentsPage from '../pages/residents/ResidentsPage';
import UnitsPage from '../pages/units/UnitsPage';
import PackagesPage from '../pages/packages/PackagesPage';
import OccurrencesPage from '../pages/occurrences/OccurrencesPage';
import ReportsPage from '../pages/reports/ReportsPage';
import AuditPage from '../pages/audit/AuditPage';
import VisitorsPage from '../pages/visitors/VisitorsPage';
import ServiceProvidersPage from '../pages/service-providers/ServiceProvidersPage';
import VehiclesPage from '../pages/vehicles/VehiclesPage';

function RequireAuth() {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (user?.mustChangePassword) {
    return <Navigate to="/change-password" replace />;
  }

  if (isAuthenticated && !user?.activeCondominiumId) {
    return <Navigate to="/select-condominium" replace />;
  }

  return <Outlet />;
}

function RequireNoAuth() {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Outlet />;
  if (user?.mustChangePassword) return <Navigate to="/change-password" replace />;
  if (!user?.activeCondominiumId) return <Navigate to="/select-condominium" replace />;
  return <Navigate to="/" replace />;
}

export const router = createBrowserRouter([
  {
    element: <RequireNoAuth />,
    children: [
      { path: '/login', element: <LoginPage /> },
    ],
  },
  {
    path: '/change-password',
    element: <ChangePasswordPage />,
  },
  {
    path: '/select-condominium',
    element: <SelectCondominiumPage />,
  },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/', element: <Navigate to="/dashboard" replace /> },
          { path: '/dashboard', element: <DashboardPage /> },
          { path: '/access', element: <AccessPage /> },
          { path: '/residents', element: <ResidentsPage /> },
          { path: '/units', element: <UnitsPage /> },
          { path: '/visitors', element: <VisitorsPage /> },
          { path: '/service-providers', element: <ServiceProvidersPage /> },
          { path: '/vehicles', element: <VehiclesPage /> },
          { path: '/packages', element: <PackagesPage /> },
          { path: '/occurrences', element: <OccurrencesPage /> },
          { path: '/reports', element: <ReportsPage /> },
          { path: '/audit', element: <AuditPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
