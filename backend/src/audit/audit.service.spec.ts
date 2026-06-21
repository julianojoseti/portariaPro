import { Test } from '@nestjs/testing';
import { AuditService } from './audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { createMockPrismaService } from '../test/prisma-mock.factory';
import { createTenantCtx } from '../test/fixtures.factory';

describe('AuditService', () => {
  let service: AuditService;
  let prisma: ReturnType<typeof createMockPrismaService>;

  beforeEach(async () => {
    prisma = createMockPrismaService();
    const module = await Test.createTestingModule({
      providers: [
        AuditService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get(AuditService);
  });

  describe('findAll', () => {
    it('should return paginated audit logs scoped by tenant', async () => {
      const ctx = createTenantCtx();
      const logs = [
        { id: '1', entity: 'User', action: 'CREATE', userId: 'u1', createdAt: new Date() },
        { id: '2', entity: 'Unit', action: 'UPDATE', userId: 'u2', createdAt: new Date() },
      ];
      prisma.auditLog.findMany.mockResolvedValue(logs);
      prisma.auditLog.count.mockResolvedValue(2);

      const result = await service.findAll(ctx);

      expect(result).toEqual({ data: logs, total: 2, page: 1, limit: 50 });
      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            companyId: ctx.companyId,
            condominiumId: ctx.condominiumId,
          }),
          skip: 0,
          take: 50,
          orderBy: { createdAt: 'desc' },
        }),
      );
    });

    it('should filter by entity', async () => {
      const ctx = createTenantCtx();
      prisma.auditLog.findMany.mockResolvedValue([]);
      prisma.auditLog.count.mockResolvedValue(0);

      await service.findAll(ctx, 1, 50, 'User');

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ entity: 'User' }),
        }),
      );
    });

    it('should filter by userId', async () => {
      const ctx = createTenantCtx();
      prisma.auditLog.findMany.mockResolvedValue([]);
      prisma.auditLog.count.mockResolvedValue(0);

      await service.findAll(ctx, 1, 50, undefined, 'user-123');

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId: 'user-123' }),
        }),
      );
    });

    it('should filter by date range', async () => {
      const ctx = createTenantCtx();
      prisma.auditLog.findMany.mockResolvedValue([]);
      prisma.auditLog.count.mockResolvedValue(0);

      await service.findAll(ctx, 1, 50, undefined, undefined, '2024-01-01', '2024-12-31');

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: {
              gte: expect.any(Date),
              lte: expect.any(Date),
            },
          }),
        }),
      );
    });

    it('should filter by dateFrom only', async () => {
      const ctx = createTenantCtx();
      prisma.auditLog.findMany.mockResolvedValue([]);
      prisma.auditLog.count.mockResolvedValue(0);

      await service.findAll(ctx, 1, 50, undefined, undefined, '2024-06-01');

      const calledWhere = prisma.auditLog.findMany.mock.calls[0][0].where;
      expect(calledWhere.createdAt).toEqual({ gte: expect.any(Date) });
      expect(calledWhere.createdAt).not.toHaveProperty('lte');
    });

    it('should filter by dateTo only', async () => {
      const ctx = createTenantCtx();
      prisma.auditLog.findMany.mockResolvedValue([]);
      prisma.auditLog.count.mockResolvedValue(0);

      await service.findAll(ctx, 1, 50, undefined, undefined, undefined, '2024-12-31');

      const calledWhere = prisma.auditLog.findMany.mock.calls[0][0].where;
      expect(calledWhere.createdAt).toEqual({ lte: expect.any(Date) });
      expect(calledWhere.createdAt).not.toHaveProperty('gte');
    });

    it('should NOT add createdAt filter when no dates provided', async () => {
      const ctx = createTenantCtx();
      prisma.auditLog.findMany.mockResolvedValue([]);
      prisma.auditLog.count.mockResolvedValue(0);

      await service.findAll(ctx);

      const calledWhere = prisma.auditLog.findMany.mock.calls[0][0].where;
      expect(calledWhere).not.toHaveProperty('createdAt');
    });

    it('should calculate correct skip for pagination', async () => {
      const ctx = createTenantCtx();
      prisma.auditLog.findMany.mockResolvedValue([]);
      prisma.auditLog.count.mockResolvedValue(0);

      await service.findAll(ctx, 3, 50);

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 100, take: 50 }),
      );
    });

    it('should include user select with id, name, email', async () => {
      const ctx = createTenantCtx();
      prisma.auditLog.findMany.mockResolvedValue([]);
      prisma.auditLog.count.mockResolvedValue(0);

      await service.findAll(ctx);

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: { user: { select: { id: true, name: true, email: true } } },
        }),
      );
    });
  });
});
