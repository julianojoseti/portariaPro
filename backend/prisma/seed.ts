import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Portaria Pro database...');

  // ── Roles ──────────────────────────────────────────
  const roles = [
    { name: 'SUPER_ADMIN', description: 'Administrador da plataforma' },
    { name: 'COMPANY_ADMIN', description: 'Administrador da empresa administradora' },
    { name: 'MANAGER', description: 'Síndico / Gestor do condomínio' },
    { name: 'DOORMAN', description: 'Porteiro' },
    { name: 'RESIDENT', description: 'Morador' },
    { name: 'EMPLOYEE', description: 'Zelador / Funcionário' },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: role,
    });
  }

  console.log('✅ Roles created');

  // ── Super Admin Company (platform owner) ──────────
  const company = await prisma.company.upsert({
    where: { cnpj: '00.000.000/0001-00' },
    update: {},
    create: {
      name: 'Portaria Pro',
      cnpj: '00.000.000/0001-00',
      email: 'admin@portariapro.com.br',
      plan: 'enterprise',
      isActive: true,
    },
  });

  console.log('✅ Company created:', company.name);

  // ── Super Admin User ───────────────────────────────
  const superAdminRole = await prisma.role.findUnique({ where: { name: 'SUPER_ADMIN' } });
  const passwordHash = await bcrypt.hash('Admin@2024!', 12);

  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@portariapro.com.br' },
    update: {},
    create: {
      companyId: company.id,
      roleId: superAdminRole!.id,
      name: 'Super Administrador',
      email: 'admin@portariapro.com.br',
      passwordHash,
      mustChangePassword: false,
      isActive: true,
      lgpdConsentAt: new Date(),
    },
  });

  console.log('✅ Super Admin created:', superAdmin.email);

  // ── Demo Company ───────────────────────────────────
  const demoCompany = await prisma.company.upsert({
    where: { cnpj: '12.345.678/0001-99' },
    update: {},
    create: {
      name: 'Administradora Demo Ltda',
      cnpj: '12.345.678/0001-99',
      email: 'contato@admindemo.com.br',
      plan: 'pro',
      isActive: true,
    },
  });

  // ── Demo Condominium ───────────────────────────────
  const demoCondominium = await prisma.condominium.upsert({
    where: { id: 'demo-condo-1' },
    update: {},
    create: {
      id: 'demo-condo-1',
      companyId: demoCompany.id,
      name: 'Residencial Parque das Flores',
      address: 'Rua das Flores, 100',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01310-100',
      phone: '(11) 3000-0000',
      syndicName: 'João Silva',
      isActive: true,
    },
  });

  // ── Demo Admin User ────────────────────────────────
  const companyAdminRole = await prisma.role.findUnique({ where: { name: 'COMPANY_ADMIN' } });
  const demoPassHash = await bcrypt.hash('Demo@2024!', 12);

  const demoAdmin = await prisma.user.upsert({
    where: { email: 'admin@admindemo.com.br' },
    update: {},
    create: {
      companyId: demoCompany.id,
      roleId: companyAdminRole!.id,
      name: 'Admin Demo',
      email: 'admin@admindemo.com.br',
      passwordHash: demoPassHash,
      mustChangePassword: false,
      isActive: true,
      lgpdConsentAt: new Date(),
    },
  });

  await prisma.userCondominium.upsert({
    where: { userId_condominiumId: { userId: demoAdmin.id, condominiumId: demoCondominium.id } },
    update: {},
    create: { userId: demoAdmin.id, condominiumId: demoCondominium.id, companyId: demoCompany.id, isActive: true },
  });

  // ── Demo Doorman ───────────────────────────────────
  const doormanRole = await prisma.role.findUnique({ where: { name: 'DOORMAN' } });
  const doormanHash = await bcrypt.hash('Porteiro@2024!', 12);

  const doorman = await prisma.user.upsert({
    where: { email: 'porteiro@admindemo.com.br' },
    update: {},
    create: {
      companyId: demoCompany.id,
      roleId: doormanRole!.id,
      name: 'Porteiro Demo',
      email: 'porteiro@admindemo.com.br',
      passwordHash: doormanHash,
      mustChangePassword: false,
      isActive: true,
      lgpdConsentAt: new Date(),
    },
  });

  await prisma.userCondominium.upsert({
    where: { userId_condominiumId: { userId: doorman.id, condominiumId: demoCondominium.id } },
    update: {},
    create: { userId: doorman.id, condominiumId: demoCondominium.id, companyId: demoCompany.id, isActive: true },
  });

  // ── Demo Units ─────────────────────────────────────
  const units = ['101', '102', '201', '202', '301'].map((n, i) => ({
    block: i < 3 ? 'A' : 'B',
    number: n,
    type: 'apartment',
    companyId: demoCompany.id,
    condominiumId: demoCondominium.id,
  }));

  const createdUnits: any[] = [];
  for (const u of units) {
    const unit = await prisma.unit.upsert({
      where: { condominiumId_block_number: { condominiumId: u.condominiumId, block: u.block, number: u.number } },
      update: {},
      create: u,
    });
    createdUnits.push(unit);
  }

  console.log('✅ Demo data created');
  console.log('\n📋 Login credentials:');
  console.log('  Super Admin: admin@portariapro.com.br / Admin@2024!');
  console.log('  Admin Demo:  admin@admindemo.com.br   / Demo@2024!');
  console.log('  Porteiro:    porteiro@admindemo.com.br / Porteiro@2024!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
