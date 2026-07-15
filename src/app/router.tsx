import { createBrowserRouter } from 'react-router';
import { Layout } from './components/layout/Layout';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { AdminRoute } from './components/layout/AdminRoute';
import { Home } from './pages/Home';
import { SearchPage } from './pages/SearchPage';
import { TrailDetailPage } from './pages/TrailDetailPage';
import { ReportPage } from './pages/ReportPage';
import { ProfilePage } from './pages/ProfilePage';
import { ReportsPage } from './pages/ReportsPage';
import { ParkDetailPage } from './pages/ParkDetailPage';
import { ParkReportPage } from './pages/ParkReportPage';
import { SignInPage } from './pages/auth/SignInPage';
import { SignUpPage } from './pages/auth/SignUpPage';
import { ErrorPage } from './pages/ErrorPage';
import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminOverview } from './pages/admin/AdminOverview';
import { AdminParksPage } from './pages/admin/AdminParksPage';
import { AddParkPage } from './pages/admin/AddParkPage';
import { EditParkPage } from './pages/admin/EditParkPage';
import { AdminTrailsPage } from './pages/admin/AdminTrailsPage';
import { AdminReportsPage } from './pages/admin/AdminReportsPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <Home /> },
      { path: 'search', element: <SearchPage /> },
      { path: 'parks/:parkName', element: <ParkDetailPage /> },
      { path: 'parks/:parkName/report', element: <ParkReportPage /> },
      { path: 'trails/:trailId', element: <TrailDetailPage /> },
      { path: 'trails/:trailId/report', element: <ReportPage /> },
      { path: 'reports', element: <ReportsPage /> },
      {
        path: 'profile',
        element: (
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        ),
      },
      { path: 'auth/signin', element: <SignInPage /> },
      { path: 'auth/signup', element: <SignUpPage /> },
      { path: 'auth/forgot-password', element: <ForgotPasswordPage /> },
      { path: 'auth/reset-password', element: <ResetPasswordPage /> },
      { path: '*', element: <ErrorPage /> },
    ],
  },
  {
    path: '/admin',
    element: (
      <AdminRoute>
        <AdminLayout />
      </AdminRoute>
    ),
    children: [
      { index: true, element: <AdminOverview /> },
      { path: 'parks', element: <AdminParksPage /> },
      { path: 'parks/new', element: <AddParkPage /> },
      { path: 'parks/:parkName/edit', element: <EditParkPage /> },
      { path: 'trails', element: <AdminTrailsPage /> },
      { path: 'reports', element: <AdminReportsPage /> },
      { path: 'users', element: <AdminUsersPage /> },
    ],
  },
]);
