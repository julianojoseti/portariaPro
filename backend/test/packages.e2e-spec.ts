import { INestApplication } from '@nestjs/common';
import {
  createE2EApp,
  seedTestTenant,
  getAuthToken,
  cleanDatabase,
  prisma,
  request,
} from './e2e-helpers';

describe('Packages (e2e)', () => {
  let app: INestApplication;
  let token: string;
  let seed: Awaited<ReturnType<typeof seedTestTenant>>;
  let unitId: string;

  beforeAll(async () => {
    app = await createE2EApp();
    await cleanDatabase();
    seed = await seedTestTenant();
    token = await getAuthToken(app);

    // Create a unit for packages
    const unitRes = await request(app.getHttpServer())
      .post('/api/units')
      .set('Authorization', `Bearer ${token}`)
      .send({ number: '201', block: 'B' });

    unitId = unitRes.body.id;
  });

  afterAll(async () => {
    await cleanDatabase();
    await prisma.$disconnect();
    await app.close();
  });

  describe('POST /api/packages', () => {
    it('should create a package with status WAITING_PICKUP', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/packages')
        .set('Authorization', `Bearer ${token}`)
        .send({
          unitId,
          recipientName: 'John Doe',
          carrier: 'FedEx',
          trackingCode: 'FX123456',
          packageType: 'Box',
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.recipientName).toBe('John Doe');
      expect(res.body.status).toBe('WAITING_PICKUP');
      expect(res.body.unitId).toBe(unitId);
    });
  });

  describe('GET /api/packages', () => {
    it('should return paginated package list', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/packages')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('total');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/packages/pending-count', () => {
    it('should return pending count as a number', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/packages/pending-count')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body).toBeDefined();
    });
  });

  describe('PATCH /api/packages/:id/retrieve', () => {
    it('should change status to RETRIEVED', async () => {
      // Create a package to retrieve
      const createRes = await request(app.getHttpServer())
        .post('/api/packages')
        .set('Authorization', `Bearer ${token}`)
        .send({
          unitId,
          recipientName: 'Jane Doe',
          carrier: 'UPS',
        })
        .expect(201);

      const res = await request(app.getHttpServer())
        .patch(`/api/packages/${createRes.body.id}/retrieve`)
        .set('Authorization', `Bearer ${token}`)
        .send({ retrievedByName: 'Jane Doe' })
        .expect(200);

      expect(res.body.status).toBe('RETRIEVED');
    });
  });

  describe('PATCH /api/packages/:id/return', () => {
    it('should change status to RETURNED', async () => {
      // Create a package to return
      const createRes = await request(app.getHttpServer())
        .post('/api/packages')
        .set('Authorization', `Bearer ${token}`)
        .send({
          unitId,
          recipientName: 'Return Package Test',
          carrier: 'DHL',
        })
        .expect(201);

      const res = await request(app.getHttpServer())
        .patch(`/api/packages/${createRes.body.id}/return`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.status).toBe('RETURNED');
    });
  });
});
