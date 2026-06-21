import { describe, it, expect, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../test/render-helpers';
import LoginPage from './LoginPage';
import { useAuthStore } from '../../store/authStore';

describe('LoginPage', () => {
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

  it('renders email and password inputs', () => {
    renderWithProviders(<LoginPage />);

    expect(screen.getByPlaceholderText('seu@email.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
  });

  it('renders the "Entrar" button', () => {
    renderWithProviders(<LoginPage />);

    expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument();
  });

  it('renders labels for email and password fields', () => {
    renderWithProviders(<LoginPage />);

    expect(screen.getByText('E-mail')).toBeInTheDocument();
    expect(screen.getByText('Senha')).toBeInTheDocument();
  });

  it('shows error message on failed login', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);

    await user.type(screen.getByPlaceholderText('seu@email.com'), 'wrong@test.com');
    await user.type(screen.getByPlaceholderText('••••••••'), 'wrongpassword');
    await user.click(screen.getByRole('button', { name: /entrar/i }));

    await waitFor(() => {
      expect(screen.getByText(/credenciais inválidas/i)).toBeInTheDocument();
    });
  });

  it('toggles password visibility when clicking the eye icon', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);

    const passwordInput = screen.getByPlaceholderText('••••••••');
    expect(passwordInput).toHaveAttribute('type', 'password');

    // Click the toggle button (the button inside the password field container)
    const toggleButtons = screen.getAllByRole('button');
    const eyeButton = toggleButtons.find(
      (btn) => btn.getAttribute('type') === 'button',
    )!;
    await user.click(eyeButton);

    expect(passwordInput).toHaveAttribute('type', 'text');

    // Click again to hide
    await user.click(eyeButton);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });
});
