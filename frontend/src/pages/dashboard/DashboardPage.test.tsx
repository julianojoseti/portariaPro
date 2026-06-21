import { describe, it, expect, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../test/render-helpers';
import DashboardPage from './DashboardPage';
import { useAuthStore } from '../../store/authStore';

describe('DashboardPage', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({
      user: {
        id: 'user-1',
        name: 'Test User',
        email: 'test@test.com',
        role: 'COMPANY_ADMIN',
        companyId: 'comp-1',
        activeCondominiumId: 'condo-1',
      },
      accessToken: 'fake-access-token',
      refreshToken: 'fake-refresh-token',
      condominiums: [{ id: 'condo-1', name: 'Test Condo' }],
      isAuthenticated: true,
      isLoading: false,
    });
  });

  it('renders loading spinner initially', () => {
    renderWithProviders(<DashboardPage />);
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('renders KPI card labels after data loads', async () => {
    renderWithProviders(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Dentro agora')).toBeInTheDocument();
    });

    expect(screen.getByText('Aguardando acesso')).toBeInTheDocument();
    expect(screen.getByText('Encomendas pendentes')).toBeInTheDocument();
    expect(screen.getByText('Ocorrências abertas')).toBeInTheDocument();
    expect(screen.getByText('Entradas hoje')).toBeInTheDocument();
  });

  it('renders the dashboard title', async () => {
    renderWithProviders(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });
  });

  it('renders recent access section', async () => {
    renderWithProviders(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Últimas movimentações')).toBeInTheDocument();
    });
  });
});
