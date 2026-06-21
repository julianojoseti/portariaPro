import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from './authStore';

describe('authStore', () => {
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

  describe('login', () => {
    it('sets user, tokens, condominiums and isAuthenticated on success', async () => {
      const data = await useAuthStore.getState().login('test@test.com', 'Test@1234');

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toEqual(data.user);
      expect(state.accessToken).toBe('fake-access-token');
      expect(state.refreshToken).toBe('fake-refresh-token');
      expect(state.condominiums).toEqual([{ id: 'condo-1', name: 'Test Condo' }]);
      expect(state.isLoading).toBe(false);
    });

    it('stores tokens in localStorage on success', async () => {
      await useAuthStore.getState().login('test@test.com', 'Test@1234');

      expect(localStorage.getItem('accessToken')).toBe('fake-access-token');
      expect(localStorage.getItem('refreshToken')).toBe('fake-refresh-token');
    });

    it('does not modify state on login failure', async () => {
      await expect(
        useAuthStore.getState().login('wrong@test.com', 'wrongpass'),
      ).rejects.toThrow();

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(state.accessToken).toBeNull();
      expect(state.isLoading).toBe(false);
    });

    it('resets isLoading to false after failure', async () => {
      try {
        await useAuthStore.getState().login('wrong@test.com', 'wrongpass');
      } catch {
        // expected
      }
      expect(useAuthStore.getState().isLoading).toBe(false);
    });
  });

  describe('selectCondominium', () => {
    it('updates tokens and activeCondominiumId', async () => {
      // Pre-set authenticated state
      useAuthStore.setState({
        user: {
          id: 'user-1',
          name: 'Test User',
          email: 'test@test.com',
          role: 'COMPANY_ADMIN',
          companyId: 'comp-1',
          activeCondominiumId: null,
        },
        accessToken: 'fake-access-token',
        refreshToken: 'fake-refresh-token',
        isAuthenticated: true,
      });

      await useAuthStore.getState().selectCondominium('condo-1');

      const state = useAuthStore.getState();
      expect(state.accessToken).toBe('new-access-token');
      expect(state.refreshToken).toBe('new-refresh-token');
      expect(state.user?.activeCondominiumId).toBe('condo-1');
      expect(localStorage.getItem('accessToken')).toBe('new-access-token');
      expect(localStorage.getItem('refreshToken')).toBe('new-refresh-token');
    });
  });

  describe('logout', () => {
    it('clears localStorage and resets store state', async () => {
      // Pre-set authenticated state
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
      });
      localStorage.setItem('accessToken', 'fake-access-token');
      localStorage.setItem('refreshToken', 'fake-refresh-token');

      await useAuthStore.getState().logout();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.accessToken).toBeNull();
      expect(state.refreshToken).toBeNull();
      expect(state.condominiums).toEqual([]);
      expect(state.isAuthenticated).toBe(false);
      expect(localStorage.getItem('accessToken')).toBeNull();
      expect(localStorage.getItem('refreshToken')).toBeNull();
    });
  });

  describe('setTokens', () => {
    it('stores tokens in localStorage and state', () => {
      useAuthStore.getState().setTokens('new-access', 'new-refresh');

      const state = useAuthStore.getState();
      expect(state.accessToken).toBe('new-access');
      expect(state.refreshToken).toBe('new-refresh');
      expect(localStorage.getItem('accessToken')).toBe('new-access');
      expect(localStorage.getItem('refreshToken')).toBe('new-refresh');
    });
  });
});
