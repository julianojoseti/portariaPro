import { INestApplication } from '@nestjs/common';
import {
  createE2EApp,
  seedTestTenant,
  getAuthToken,
  cleanDatabase,
  prisma,
  request,
} from './e2e-helpers';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let seed: Awaited<ReturnType<typeof seedTestTenant>>;

  beforeAll(async () => {
    app = await createE2EApp();
    await cleanDatabase();
    seed = await seedTestTenant();
  });

  afterAll(async () => {
    await cleanDatabase();
    await prisma.$disconnect();
    await app.close();
  });

  describe('POST /api/auth/login', () => {
    it('should return tokens, user, and condominiums for valid credentials', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'admin@test.com', password: 'Test@1234' })
        .expect(200);

      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
      expect(res.body).toHaveProperty('user');
      expect(res.body).toHaveProperty('condominiums');
      expect(res.body.user.email).toBe('admin@test.com');
      expect(res.body.user.role).toBe('COMPANY_ADMIN');
      expect(res.body.condominiums.length).toBeGreaterThan(0);
    });

    it('should return 401 for wrong password', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'admin@test.com', password: 'WrongPass123' })
        .expect(401);
    });

    it('should return 401 for non-existent email', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'nobody@test.com', password: 'Test@1234' })
        .expect(401);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return 401 without token', async () => {
      await request(app.getHttpServer()).get('/api/auth/me').expect(401);
    });

    it('should return user data with valid token', async () => {
      const token = await getAuthToken(app, 'doorman@test.com');
      const res = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('email', 'doorman@test.com');
    });
  });

  describe('POST /api/auth/select-condominium', () => {
    it('should return new tokens when selecting a condominium', async () => {
      const condo2 = await prisma.condominium.create({
        data: { companyId: seed.company.id, name: 'Second Condo', isActive: true },
      });
      const hash = require('bcryptjs').hashSync('Select@1234', 12);
      const selectUser = await prisma.user.create({
        data: {
          companyId: seed.company.id,
          roleId: seed.roles['DOORMAN'].id,
          name: 'Select User',
          email: 'select@test.com',
          passwordHash: hash,
          mustChangePassword: false,
          isActive: true,
        },
      });
      await prisma.userCondominium.create({
        data: { userId: selectUser.id, condominiumId: seed.condominium.id, companyId: seed.company.id, isActive: true },
      });
      await prisma.userCondominium.create({
        data: { userId: selectUser.id, condominiumId: condo2.id, companyId: seed.company.id, isActive: true },
      });

      const loginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'select@test.com', password: 'Select@1234' })
        .expect(200);

      expect(loginRes.body.user.activeCondominiumId).toBeNull();

      const res = await request(app.getHttpServer())
        .post('/api/auth/select-condominium')
        .set('Authorization', `Bearer ${loginRes.body.accessToken}`)
        .send({ condominiumId: condo2.id })
        .expect(200);

      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
    });
  });

  describe('POST /api/auth/change-password', () => {
    it('should change the password', async () => {
      const hash = require('bcryptjs').hashSync('TempPass@1234', 12);
      const tempUser = await prisma.user.create({
        data: {
          companyId: seed.company.id,
          roleId: seed.roles['DOORMAN'].id,
          name: 'Temp User',
          email: 'temp@test.com',
          passwordHash: hash,
          mustChangePassword: true,
          isActive: true,
        },
      });
      await prisma.userCondominium.create({
        data: {
          userId: tempUser.id,
          condominiumId: seed.condominium.id,
          companyId: seed.company.id,
          isActive: true,
        },
      });

      const token = await getAuthToken(app, 'temp@test.com', 'TempPass@1234');

      await request(app.getHttpServer())
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({ currentPassword: 'TempPass@1234', newPassword: 'NewPass@5678' })
        .expect(200);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should accept logout request', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'admin@test.com', password: 'Test@1234' })
        .expect(200);

      await request(app.getHttpServer())
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${loginRes.body.accessToken}`)
        .send({ refreshToken: loginRes.body.refreshToken })
        .expect(200);
    });
  });
});
