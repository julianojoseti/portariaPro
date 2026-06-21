function createMockModel() {
  return {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    upsert: jest.fn(),
    groupBy: jest.fn(),
  };
}

export function createMockPrismaService() {
  return {
    user: createMockModel(),
    role: createMockModel(),
    company: createMockModel(),
    condominium: createMockModel(),
    unit: createMockModel(),
    resident: createMockModel(),
    visitor: createMockModel(),
    serviceProvider: createMockModel(),
    accessLog: createMockModel(),
    packageDelivery: createMockModel(),
    occurrence: createMockModel(),
    occurrenceComment: createMockModel(),
    auditLog: createMockModel(),
    refreshToken: createMockModel(),
    userCondominium: createMockModel(),
    vehicle: createMockModel(),
    authorization: createMockModel(),
    notification: createMockModel(),
    notice: createMockModel(),
    attachment: createMockModel(),
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    $transaction: jest.fn(),
  };
}
