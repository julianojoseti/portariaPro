import { INestApplication } from '@nestjs/common';
import {
  createE2EApp,
  seedTestTenant,
  getAuthToken,
  cleanDatabase,
  prisma,
  request,
} from './e2e-helpers';

describe('Users (e2e)', () => {
  let app: INestApplication;
  let token: string;
  let seed: Awaited<ReturnType<typeof seedTestTenant>>;

  beforeAll(async () => {
    app = await createE2EApp();
    await cleanDatabase();
    seed = await seedTestTenant();
    token = await getAuthToken(app);
  });

  afterAll(async () => {
    await cleanDatabase();
    await prisma.$disconnect();
    await app.close();
  });

  describe('POST /api/users', () => {
    it('should create a new user and return 201', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/users')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'New User',
          email: 'newuser@test.com',
          password: 'Test@1234',
          roleId: seed.roles['DOORMAN'].id,
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.name).toBe('New User');
      expect(res.body.email).toBe('newuser@test.com');
      expect(res.body).not.toHaveProperty('passwordHash');
    });

    it('should return 409 for duplicate email', async () => {
      await request(app.getHttpServer())
        .post('/api/users')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Duplicate User',
          email: 'newuser@test.com',
          password: 'Test@1234',
          roleId: seed.roles['DOORMAN'].id,
        })
        .expect(409);
    });

    it('should return 403 when DOORMAN tries to create a user', async () => {
      const doormanToken = await getAuthToken(app, 'doorman@test.com', 'Test@1234');

      await request(app.getHttpServer())
        .post('/api/users')
        .set('Authorization', `Bearer ${doormanToken}`)
        .send({
          name: 'Forbidden User',
          email: 'forbidden@test.com',
          password: 'Test@1234',
          roleId: seed.roles['DOORMAN'].id,
        })
        .expect(403);
    });
  });

  describe('GET /api/users', () => {
    it('should return paginated user list', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/users')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('total');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/users/:id', () => {
    it('should return user without passwordHash', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/users/${seed.admin.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body).toHaveProperty('id', seed.admin.id);
      expect(res.body).toHaveProperty('name');
      expect(res.body).not.toHaveProperty('passwordHash');
    });
  });

  describe('PATCH /api/users/:id', () => {
    it('should update user name', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/users/${seed.doorman.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Updated Doorman' })
        .expect(200);

      expect(res.body.name).toBe('Updated Doorman');
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should soft-delete the user', async () => {
      // Create a user to delete
      const createRes = await request(app.getHttpServer())
        .post('/api/users')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'To Delete',
          email: 'delete-me@test.com',
          password: 'Test@1234',
          roleId: seed.roles['EMPLOYEE'].id,
        })
        .expect(201);

      await request(app.getHttpServer())
        .delete(`/api/users/${createRes.body.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Verify soft-delete in the database
      const deleted = await prisma.user.findUnique({
        where: { id: createRes.body.id },
      });
      expect(deleted).not.toBeNull();
      expect(deleted!.deletedAt).not.toBeNull();
    });
  });
});
