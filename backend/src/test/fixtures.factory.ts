import { faker } from '@faker-js/faker';

export function createTenantCtx(overrides: Partial<{
  companyId: string;
  condominiumId: string;
  userId: string;
  role: string;
}> = {}) {
  return {
    companyId: overrides.companyId ?? faker.string.uuid(),
    condominiumId: overrides.condominiumId ?? faker.string.uuid(),
    userId: overrides.userId ?? faker.string.uuid(),
    role: overrides.role ?? 'COMPANY_ADMIN',
  };
}

export function createMockUser(overrides: Record<string, any> = {}) {
  return {
    id: faker.string.uuid(),
    companyId: faker.string.uuid(),
    roleId: faker.string.uuid(),
    name: faker.person.fullName(),
    email: faker.internet.email(),
    passwordHash: '$2a$12$fakehashedpassword',
    phone: faker.phone.number(),
    photoUrl: null,
    isActive: true,
    mustChangePassword: false,
    lastLoginAt: null,
    lastLoginIp: null,
    lastLoginAgent: null,
    lgpdConsentAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    role: { id: faker.string.uuid(), name: 'COMPANY_ADMIN', description: 'Admin' },
    condominiums: [],
    ...overrides,
  };
}

export function createMockCondominium(overrides: Record<string, any> = {}) {
  return {
    id: faker.string.uuid(),
    companyId: faker.string.uuid(),
    name: faker.company.name() + ' Residencial',
    address: faker.location.streetAddress(),
    city: faker.location.city(),
    state: 'SP',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  };
}

export function createMockUnit(overrides: Record<string, any> = {}) {
  return {
    id: faker.string.uuid(),
    companyId: faker.string.uuid(),
    condominiumId: faker.string.uuid(),
    block: 'A',
    number: faker.number.int({ min: 100, max: 999 }).toString(),
    type: 'apartment',
    floor: faker.number.int({ min: 1, max: 20 }),
    parkingSpots: 1,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  };
}

export function createMockResident(overrides: Record<string, any> = {}) {
  return {
    id: faker.string.uuid(),
    companyId: faker.string.uuid(),
    condominiumId: faker.string.uuid(),
    unitId: faker.string.uuid(),
    name: faker.person.fullName(),
    document: faker.string.numeric(11),
    email: faker.internet.email(),
    phone: faker.phone.number(),
    type: 'OWNER',
    isActive: true,
    canAuthorizeVisitors: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    unit: { id: faker.string.uuid(), block: 'A', number: '101' },
    ...overrides,
  };
}

export function createMockAccessLog(overrides: Record<string, any> = {}) {
  return {
    id: faker.string.uuid(),
    companyId: faker.string.uuid(),
    condominiumId: faker.string.uuid(),
    personType: 'VISITOR',
    personName: faker.person.fullName(),
    status: 'WAITING',
    operatorId: faker.string.uuid(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function createMockPackage(overrides: Record<string, any> = {}) {
  return {
    id: faker.string.uuid(),
    companyId: faker.string.uuid(),
    condominiumId: faker.string.uuid(),
    unitId: faker.string.uuid(),
    recipientName: faker.person.fullName(),
    carrier: 'Correios',
    status: 'WAITING_PICKUP',
    receivedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    unit: { id: faker.string.uuid(), block: 'A', number: '101' },
    ...overrides,
  };
}

export function createMockOccurrence(overrides: Record<string, any> = {}) {
  return {
    id: faker.string.uuid(),
    companyId: faker.string.uuid(),
    condominiumId: faker.string.uuid(),
    type: 'NOISE',
    title: faker.lorem.sentence(),
    description: faker.lorem.paragraph(),
    priority: 'MEDIUM',
    status: 'OPEN',
    reportedById: faker.string.uuid(),
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  };
}
