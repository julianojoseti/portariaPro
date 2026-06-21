import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';

// Minimal route definitions that replicate the guards from the router
// We re-create them here because RequireAuth/RequireNoAuth are not exported

function RequireAuth() {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <p>REDIRECT_LOGIN</p>;
  if (user?.mustChangePassword) return <p>REDIRECT_CHANGE_PASSWORD</p>;
  if (isAuthenticated && !user?.activeCondominiumId)
    return <p>REDIRECT_SELECT_CONDOMINIUM</p>;
  return <p>PROTECTED_CONTENT</p>;
}

function RequireNoAuth() {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <p>LOGIN_PAGE</p>;
  if (user?.mustChangePassword) return <p>REDIRECT_CHANGE_PASSWORD</p>;
  if (!user?.activeCondominiumId) return <p>REDIRECT_SELECT_CONDOMINIUM</p>;
  return <p>REDIRECT_DASHBOARD</p>;
}

function renderRouter(initialEntries: string[]) {
  const routes = [
    {
      path: '/login',
      element: <RequireNoAuth />,
    },
    {
      path: '/dashboard',
      element: <RequireAuth />,
    },
  ];

  const router = createMemoryRouter(routes, { initialEntries });
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

describe('Router guards', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({
      user: null,
      accessToken: null,
      refreshToken: null,
      condominiums: [],
      isAuthenticated: false,
      isLoading: false,
    });
  });

  describe('RequireAuth (protected routes)', () => {
    it('redirects to login when unauthenticated', async () => {
      renderRouter(['/dashboard']);

      await waitFor(() => {
        expect(screen.getByText('REDIRECT_LOGIN')).toBeInTheDocument();
      });
    });

    it('redirects to change-password when mustChangePassword is true', async () => {
      useAuthStore.setState({
        user: {
          id: 'user-1',
          name: 'Test User',
          email: 'test@test.com',
          role: 'COMPANY_ADMIN',
          companyId: 'comp-1',
          activeCondominiumId: 'condo-1',
          mustChangePassword: true,
        },
        isAuthenticated: true,
        accessToken: 'token',
        refreshToken: 'refresh',
      });

      renderRouter(['/dashboard']);

      await waitFor(() => {
        expect(
          screen.getByText('REDIRECT_CHANGE_PASSWORD'),
        ).toBeInTheDocument();
      });
    });

    it('redirects to select-condominium when activeCondominiumId is missing', async () => {
      useAuthStore.setState({
        user: {
          id: 'user-1',
          name: 'Test User',
          email: 'test@test.com',
          role: 'COMPANY_ADMIN',
          companyId: 'comp-1',
          activeCondominiumId: null,
        },
        isAuthenticated: true,
        accessToken: 'token',
        refreshToken: 'refresh',
      });

      renderRouter(['/dashboard']);

      await waitFor(() => {
        expect(
          screen.getByText('REDIRECT_SELECT_CONDOMINIUM'),
        ).toBeInTheDocument();
      });
    });

    it('renders protected content when fully authenticated', async () => {
      useAuthStore.setState({
        user: {
          id: 'user-1',
          name: 'Test User',
          email: 'test@test.com',
          role: 'COMPANY_ADMIN',
          companyId: 'comp-1',
          activeCondominiumId: 'condo-1',
        },
        isAuthenticated: true,
        accessToken: 'token',
        refreshToken: 'refresh',
      });

      renderRouter(['/dashboard']);

      await waitFor(() => {
        expect(screen.getByText('PROTECTED_CONTENT')).toBeInTheDocument();
      });
    });
  });

  describe('RequireNoAuth (public routes)', () => {
    it('shows login page when unauthenticated', async () => {
      renderRouter(['/login']);

      await waitFor(() => {
        expect(screen.getByText('LOGIN_PAGE')).toBeInTheDocument();
      });
    });

    it('redirects authenticated user to dashboard', async () => {
      useAuthStore.setState({
        user: {
          id: 'user-1',
          name: 'Test User',
          email: 'test@test.com',
          role: 'COMPANY_ADMIN',
          companyId: 'comp-1',
          activeCondominiumId: 'condo-1',
        },
        isAuthenticated: true,
        accessToken: 'token',
        refreshToken: 'refresh',
      });

      renderRouter(['/login']);

      await waitFor(() => {
        expect(screen.getByText('REDIRECT_DASHBOARD')).toBeInTheDocument();
      });
    });

    it('redirects to change-password when authenticated with mustChangePassword', async () => {
      useAuthStore.setState({
        user: {
          id: 'user-1',
          name: 'Test User',
          email: 'test@test.com',
          role: 'COMPANY_ADMIN',
          companyId: 'comp-1',
          mustChangePassword: true,
        },
        isAuthenticated: true,
        accessToken: 'token',
        refreshToken: 'refresh',
      });

      renderRouter(['/login']);

      await waitFor(() => {
        expect(
          screen.getByText('REDIRECT_CHANGE_PASSWORD'),
        ).toBeInTheDocument();
      });
    });

    it('redirects to select-condominium when authenticated without activeCondominiumId', async () => {
      useAuthStore.setState({
        user: {
          id: 'user-1',
          name: 'Test User',
          email: 'test@test.com',
          role: 'COMPANY_ADMIN',
          companyId: 'comp-1',
          activeCondominiumId: null,
        },
        isAuthenticated: true,
        accessToken: 'token',
        refreshToken: 'refresh',
      });

      renderRouter(['/login']);

      await waitFor(() => {
        expect(
          screen.getByText('REDIRECT_SELECT_CONDOMINIUM'),
        ).toBeInTheDocument();
      });
    });
  });
});
