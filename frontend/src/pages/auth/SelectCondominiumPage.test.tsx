import { describe, it, expect, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../test/render-helpers';
import SelectCondominiumPage from './SelectCondominiumPage';
import { useAuthStore } from '../../store/authStore';

describe('SelectCondominiumPage', () => {
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

  it('renders list of condominiums as buttons', () => {
    useAuthStore.setState({
      user: {
        id: 'user-1',
        name: 'Test User',
        email: 'test@test.com',
        role: 'COMPANY_ADMIN',
        companyId: 'comp-1',
        activeCondominiumId: null,
      },
      condominiums: [
        { id: 'condo-1', name: 'Residencial Alpha' },
        { id: 'condo-2', name: 'Edifício Beta' },
      ],
      isAuthenticated: true,
    });

    renderWithProviders(<SelectCondominiumPage />);

    expect(screen.getByText('Residencial Alpha')).toBeInTheDocument();
    expect(screen.getByText('Edifício Beta')).toBeInTheDocument();
  });

  it('shows "Nenhum condomínio disponível" when the list is empty', () => {
    useAuthStore.setState({
      user: {
        id: 'user-1',
        name: 'Test User',
        email: 'test@test.com',
        role: 'COMPANY_ADMIN',
        companyId: 'comp-1',
        activeCondominiumId: null,
      },
      condominiums: [],
      isAuthenticated: true,
    });

    renderWithProviders(<SelectCondominiumPage />);

    expect(
      screen.getByText(/nenhum condomínio disponível/i),
    ).toBeInTheDocument();
  });

  it('renders the logout button ("Sair")', () => {
    useAuthStore.setState({
      user: {
        id: 'user-1',
        name: 'Test User',
        email: 'test@test.com',
        role: 'COMPANY_ADMIN',
        companyId: 'comp-1',
        activeCondominiumId: null,
      },
      condominiums: [{ id: 'condo-1', name: 'Residencial Alpha' }],
      isAuthenticated: true,
    });

    renderWithProviders(<SelectCondominiumPage />);

    expect(screen.getByText('Sair')).toBeInTheDocument();
  });

  it('displays greeting with user name', () => {
    useAuthStore.setState({
      user: {
        id: 'user-1',
        name: 'Test User',
        email: 'test@test.com',
        role: 'COMPANY_ADMIN',
        companyId: 'comp-1',
        activeCondominiumId: null,
      },
      condominiums: [],
      isAuthenticated: true,
    });

    renderWithProviders(<SelectCondominiumPage />);

    expect(screen.getByText(/olá, test user/i)).toBeInTheDocument();
  });

  it('renders the page title', () => {
    useAuthStore.setState({
      user: {
        id: 'user-1',
        name: 'Test User',
        email: 'test@test.com',
        role: 'COMPANY_ADMIN',
        companyId: 'comp-1',
        activeCondominiumId: null,
      },
      condominiums: [],
      isAuthenticated: true,
    });

    renderWithProviders(<SelectCondominiumPage />);

    expect(screen.getByText('Selecione o Condomínio')).toBeInTheDocument();
  });
});
