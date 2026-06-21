import { describe, it, expect, beforeEach } from 'vitest';
import { api } from './api';

describe('api interceptors', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('request interceptor', () => {
    it('adds Authorization header when accessToken is in localStorage', () => {
      localStorage.setItem('accessToken', 'my-token');

      const config = { headers: {} as Record<string, string> };
      const interceptor = (api.interceptors.request as any).handlers[0].fulfilled;
      const result = interceptor(config);

      expect(result.headers.Authorization).toBe('Bearer my-token');
    });

    it('does not add Authorization header when no token is stored', () => {
      const config = { headers: {} as Record<string, string> };
      const interceptor = (api.interceptors.request as any).handlers[0].fulfilled;
      const result = interceptor(config);

      expect(result.headers.Authorization).toBeUndefined();
    });
  });

  describe('axios instance', () => {
    it('has baseURL configured', () => {
      expect(api.defaults.baseURL).toBeDefined();
    });

    it('has Content-Type set to application/json', () => {
      expect(api.defaults.headers['Content-Type']).toBe('application/json');
    });

    it('has a response interceptor registered', () => {
      const responseHandlers = (api.interceptors.response as any).handlers;
      expect(responseHandlers.length).toBeGreaterThan(0);
    });
  });
});
