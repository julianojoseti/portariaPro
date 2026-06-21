import { INestApplication } from '@nestjs/common';
import { createE2EApp, prisma, request } from './e2e-helpers';

describe('App (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createE2EApp();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  it('/api (GET) returns 404 (no root route)', () => {
    return request(app.getHttpServer()).get('/api').expect(404);
  });
});
