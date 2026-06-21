import { INestApplication } from '@nestjs/common';
import {
  createE2EApp,
  seedTestTenant,
  getAuthToken,
  cleanDatabase,
  prisma,
  request,
} from './e2e-helpers';

describe('AccessLogs (e2e)', () => {
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

  describe('POST /api/access-logs/entry', () => {
    it('should register entry with status INSIDE', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/access-logs/entry')
        .set('Authorization', `Bearer ${token}`)
        .send({
          personType: 'VISITOR',
          personName: 'Entry Visitor',
          personDocument: '111.222.333-44',
          purpose: 'Visit',
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.status).toBe('INSIDE');
      expect(res.body.personName).toBe('Entry Visitor');
    });
  });

  describe('GET /api/access-logs/inside', () => {
    it('should list people currently inside', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/access-logs/inside')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(
        res.body.some((log: any) => log.personName === 'Entry Visitor'),
      ).toBe(true);
    });
  });

  describe('PATCH /api/access-logs/:id/exit', () => {
    it('should mark entry as FINISHED', async () => {
      // Create a new entry first
      const entryRes = await request(app.getHttpServer())
        .post('/api/access-logs/entry')
        .set('Authorization', `Bearer ${token}`)
        .send({
          personType: 'DELIVERY',
          personName: 'Delivery Person',
        })
        .expect(201);

      const res = await request(app.getHttpServer())
        .patch(`/api/access-logs/${entryRes.body.id}/exit`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.status).toBe('FINISHED');
    });
  });

  describe('POST /api/access-logs (WAITING flow)', () => {
    let logId: string;

    it('should create access log with WAITING status', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/access-logs')
        .set('Authorization', `Bearer ${token}`)
        .send({
          personType: 'VISITOR',
          personName: 'Waiting Visitor',
          purpose: 'Meeting',
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.status).toBe('WAITING');
      logId = res.body.id;
    });

    it('PATCH /api/access-logs/:id/authorize - should change to AUTHORIZED', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/access-logs/${logId}/authorize`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.status).toBe('AUTHORIZED');
    });
  });

  describe('PATCH /api/access-logs/:id/deny', () => {
    it('should deny access with reason and change to DENIED', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/api/access-logs')
        .set('Authorization', `Bearer ${token}`)
        .send({
          personType: 'OTHER',
          personName: 'Denied Person',
        })
        .expect(201);

      const res = await request(app.getHttpServer())
        .patch(`/api/access-logs/${createRes.body.id}/deny`)
        .set('Authorization', `Bearer ${token}`)
        .send({ reason: 'Not on the guest list' })
        .expect(200);

      expect(res.body.status).toBe('DENIED');
    });
  });

  describe('GET /api/access-logs', () => {
    it('should return paginated access logs', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/access-logs')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('total');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });
});
