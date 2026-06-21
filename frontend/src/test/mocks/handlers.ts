import { http, HttpResponse } from 'msw';

const API = 'http://localhost/api';

export const handlers = [
  http.post(`${API}/auth/login`, async ({ request }) => {
    const body = (await request.json()) as any;
    if (body.email === 'test@test.com' && body.password === 'Test@1234') {
      return HttpResponse.json({
        accessToken: 'fake-access-token',
        refreshToken: 'fake-refresh-token',
        mustChangePassword: false,
        condominiums: [{ id: 'condo-1', name: 'Test Condo' }],
        user: {
          id: 'user-1',
          name: 'Test User',
          email: 'test@test.com',
          role: 'COMPANY_ADMIN',
          activeCondominiumId: 'condo-1',
        },
      });
    }
    return HttpResponse.json(
      { message: 'Credenciais inválidas' },
      { status: 401 },
    );
  }),

  http.post(`${API}/auth/select-condominium`, () =>
    HttpResponse.json({
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
    }),
  ),

  http.post(`${API}/auth/change-password`, () =>
    HttpResponse.json({ message: 'Senha alterada com sucesso' }),
  ),

  http.post(`${API}/auth/logout`, () =>
    HttpResponse.json({ message: 'ok' }),
  ),

  http.post(`${API}/auth/refresh`, () =>
    HttpResponse.json({
      accessToken: 'refreshed-access-token',
      refreshToken: 'refreshed-refresh-token',
    }),
  ),

  http.get(`${API}/auth/me`, () =>
    HttpResponse.json({
      id: 'user-1',
      name: 'Test User',
      email: 'test@test.com',
      role: 'COMPANY_ADMIN',
      activeCondominiumId: 'condo-1',
    }),
  ),

  http.get(`${API}/dashboard`, () =>
    HttpResponse.json({
      insideNow: 3,
      waitingAccess: 1,
      pendingPackages: 2,
      openOccurrences: 1,
      todayEntries: 10,
      recentAccess: [],
    }),
  ),

  http.get(`${API}/units`, () =>
    HttpResponse.json({
      data: [
        { id: 'unit-1', block: 'A', number: '101', type: 'apartment' },
      ],
      total: 1,
      page: 1,
      limit: 50,
    }),
  ),

  http.get(`${API}/residents`, () =>
    HttpResponse.json({ data: [], total: 0, page: 1, limit: 20 }),
  ),
];
