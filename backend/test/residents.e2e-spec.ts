import { INestApplication } from '@nestjs/common';
import {
  createE2EApp,
  seedTestTenant,
  getAuthToken,
  cleanDatabase,
  prisma,
  request,
} from './e2e-helpers';

describe('Residents (e2e)', () => {
  let app: INestApplication;
  let token: string;
  let seed: Awaited<ReturnType<typeof seedTestTenant>>;
  let unitId: string;

  beforeAll(async () => {
    app = await createE2EApp();
    await cleanDatabase();
    seed = await seedTestTenant();
    token = await getAuthToken(app);

    // Create a unit to associate residents with
    const unitRes = await request(app.getHttpServer())
      .post('/api/units')
      .set('Authorization', `Bearer ${token}`)
      .send({ number: '101', block: 'A' });

    unitId = unitRes.body.id;
  });

  afterAll(async () => {
    await cleanDatabase();
    await prisma.$disconnect();
    await app.close();
  });

  describe('CRUD lifecycle', () => {
    let residentId: string;

    it('POST /api/residents - should create a resident', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/residents')
        .set('Authorization', `Bearer ${token}`)
        .send({
          unitId,
          name: 'John Resident',
          document: '123.456.789-00',
          email: 'john@resident.com',
          phone: '11999990000',
          type: 'OWNER',
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.name).toBe('John Resident');
      expect(res.body.unitId).toBe(unitId);
      residentId = res.body.id;
    });

    it('GET /api/residents - should list residents with pagination', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/residents')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('total');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('GET /api/residents/:id - should return the resident', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/residents/${residentId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body).toHaveProperty('id', residentId);
      expect(res.body.name).toBe('John Resident');
    });

    it('PATCH /api/residents/:id - should update the resident', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/residents/${residentId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'John Updated' })
        .expect(200);

      expect(res.body.name).toBe('John Updated');
    });

    it('DELETE /api/residents/:id - should soft-delete the resident', async () => {
      await request(app.getHttpServer())
        .delete(`/api/residents/${residentId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const deleted = await prisma.resident.findUnique({
        where: { id: residentId },
      });
      expect(deleted).not.toBeNull();
      expect(deleted!.deletedAt).not.toBeNull();
    });
  });

  describe('GET /api/residents?search=', () => {
    it('should filter residents by name', async () => {
      // Create a resident with a unique name
      await request(app.getHttpServer())
        .post('/api/residents')
        .set('Authorization', `Bearer ${token}`)
        .send({
          unitId,
          name: 'Unique Searchable Name',
          type: 'TENANT',
        })
        .expect(201);

      const res = await request(app.getHttpServer())
        .get('/api/residents?search=Unique Searchable')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.data.length).toBeGreaterThan(0);
      expect(
        res.body.data.some((r: any) => r.name.includes('Unique Searchable')),
      ).toBe(true);
    });
  });
});
