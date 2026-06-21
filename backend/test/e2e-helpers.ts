import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AppModule } from '../src/app.module';
import { JwtAuthGuard } from '../src/common/guards/jwt-auth.guard';
import { TenantGuard } from '../src/common/guards/tenant.guard';
import { cleanDatabase, prisma } from './setup-e2e';
import * as bcrypt from 'bcryptjs';
import request from 'supertest';

export async function createE2EApp(): Promise<INestApplication> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideGuard(ThrottlerGuard)
    .useValue({ canActivate: () => true })
    .compile();

  const app = moduleFixture.createNestApplication();
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  const reflector = app.get(Reflector);
  app.useGlobalGuards(new JwtAuthGuard(reflector), new TenantGuard(reflector));
  await app.init();
  return app;
}

export async function seedTestTenant() {
  const company = await prisma.company.create({
    data: {
      name: 'Test Company',
      cnpj: '11.111.111/0001-11',
      isActive: true,
    },
  });

  const roles: Record<string, any> = {};
  for (const roleName of [
    'SUPER_ADMIN',
    'COMPANY_ADMIN',
    'MANAGER',
    'DOORMAN',
    'RESIDENT',
    'EMPLOYEE',
  ]) {
    roles[roleName] = await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: { name: roleName, description: roleName },
    });
  }

  const passwordHash = await bcrypt.hash('Test@1234', 12);
  const admin = await prisma.user.create({
    data: {
      companyId: company.id,
      roleId: roles['COMPANY_ADMIN'].id,
      name: 'Test Admin',
      email: 'admin@test.com',
      passwordHash,
      mustChangePassword: false,
      isActive: true,
    },
  });

  const condominium = await prisma.condominium.create({
    data: { companyId: company.id, name: 'Test Condo', isActive: true },
  });

  await prisma.userCondominium.create({
    data: {
      userId: admin.id,
      condominiumId: condominium.id,
      companyId: company.id,
      isActive: true,
    },
  });

  const doorman = await prisma.user.create({
    data: {
      companyId: company.id,
      roleId: roles['DOORMAN'].id,
      name: 'Test Doorman',
      email: 'doorman@test.com',
      passwordHash,
      mustChangePassword: false,
      isActive: true,
    },
  });

  await prisma.userCondominium.create({
    data: {
      userId: doorman.id,
      condominiumId: condominium.id,
      companyId: company.id,
      isActive: true,
    },
  });

  return { company, roles, admin, doorman, condominium };
}

export async function getAuthToken(
  app: INestApplication,
  email = 'admin@test.com',
  password = 'Test@1234',
): Promise<string> {
  const loginRes = await request(app.getHttpServer())
    .post('/api/auth/login')
    .send({ email, password });

  const { accessToken, condominiums, user } = loginRes.body;

  if (user?.activeCondominiumId) {
    return accessToken;
  }

  if (condominiums?.length) {
    const selectRes = await request(app.getHttpServer())
      .post('/api/auth/select-condominium')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ condominiumId: condominiums[0].id });
    return selectRes.body.accessToken;
  }

  return accessToken;
}

export { cleanDatabase, prisma, request };
