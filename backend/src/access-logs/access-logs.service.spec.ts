import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AccessLogsService } from './access-logs.service';
import { PrismaService } from '../prisma/prisma.service';
import { createMockPrismaService } from '../test/prisma-mock.factory';
import { createTenantCtx, createMockAccessLog } from '../test/fixtures.factory';

describe('AccessLogsService', () => {
  let service: AccessLogsService;
  let prisma: ReturnType<typeof createMockPrismaService>;

  beforeEach(async () => {
    prisma = createMockPrismaService();
    const module = await Test.createTestingModule({
      providers: [
        AccessLogsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get(AccessLogsService);
  });

  describe('findAll', () => {
    it('should return paginated access logs scoped by tenant', async () => {
      const ctx = createTenantCtx();
      const logs = [createMockAccessLog({ companyId: ctx.companyId, condominiumId: ctx.condominiumId })];
      prisma.accessLog.findMany.mockResolvedValue(logs);
      prisma.accessLog.count.mockResolvedValue(1);

      const result = await service.findAll(ctx);

      expect(result).toEqual({ data: logs, total: 1, page: 1, limit: 20 });
    });

    it('should filter by status', async () => {
      const ctx = createTenantCtx();
      prisma.accessLog.findMany.mockResolvedValue([]);
      prisma.accessLog.count.mockResolvedValue(0);

      await service.findAll(ctx, 1, 20, { status: 'INSIDE' as any });

      expect(prisma.accessLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'INSIDE' }),
        }),
      );
    });

    it('should filter by personType', async () => {
      const ctx = createTenantCtx();
      prisma.accessLog.findMany.mockResolvedValue([]);
      prisma.accessLog.count.mockResolvedValue(0);

      await service.findAll(ctx, 1, 20, { personType: 'VISITOR' });

      expect(prisma.accessLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ personType: 'VISITOR' }),
        }),
      );
    });

    it('should filter by unitId', async () => {
      const ctx = createTenantCtx();
      prisma.accessLog.findMany.mockResolvedValue([]);
      prisma.accessLog.count.mockResolvedValue(0);

      await service.findAll(ctx, 1, 20, { unitId: 'unit-1' });

      expect(prisma.accessLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ unitId: 'unit-1' }),
        }),
      );
    });

    it('should apply search filter across personName, personDocument and vehiclePlate', async () => {
      const ctx = createTenantCtx();
      prisma.accessLog.findMany.mockResolvedValue([]);
      prisma.accessLog.count.mockResolvedValue(0);

      await service.findAll(ctx, 1, 20, { search: 'ABC' });

      expect(prisma.accessLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { personName: { contains: 'ABC', mode: 'insensitive' } },
              { personDocument: { contains: 'ABC', mode: 'insensitive' } },
              { vehiclePlate: { contains: 'ABC', mode: 'insensitive' } },
            ],
          }),
        }),
      );
    });

    it('should filter by date range', async () => {
      const ctx = createTenantCtx();
      prisma.accessLog.findMany.mockResolvedValue([]);
      prisma.accessLog.count.mockResolvedValue(0);

      await service.findAll(ctx, 1, 20, { dateFrom: '2024-01-01', dateTo: '2024-12-31' });

      expect(prisma.accessLog.findMany).toHaveBeenCalledWith(
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
  });

  describe('findInsideNow', () => {
    it('should return logs with INSIDE status', async () => {
      const ctx = createTenantCtx();
      const insideLogs = [createMockAccessLog({ status: 'INSIDE' })];
      prisma.accessLog.findMany.mockResolvedValue(insideLogs);

      const result = await service.findInsideNow(ctx);

      expect(result).toEqual(insideLogs);
      expect(prisma.accessLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            companyId: ctx.companyId,
            condominiumId: ctx.condominiumId,
            status: 'INSIDE',
          }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return the access log', async () => {
      const ctx = createTenantCtx();
      const log = createMockAccessLog({ companyId: ctx.companyId, condominiumId: ctx.condominiumId });
      prisma.accessLog.findFirst.mockResolvedValue(log);

      const result = await service.findOne(log.id, ctx);

      expect(result.id).toBe(log.id);
    });

    it('should throw NotFoundException when not found', async () => {
      const ctx = createTenantCtx();
      prisma.accessLog.findFirst.mockResolvedValue(null);

      await expect(service.findOne('bad-id', ctx)).rejects.toThrow(NotFoundException);
    });
  });

  describe('registerEntry', () => {
    it('should create an access log with status INSIDE and entryAt', async () => {
      const ctx = createTenantCtx();
      const dto = { personName: 'Visitor X', personType: 'VISITOR', unitId: 'unit-1' } as any;
      const created = createMockAccessLog({ status: 'INSIDE', entryAt: new Date() });
      prisma.accessLog.create.mockResolvedValue(created);

      const result = await service.registerEntry(dto, ctx);

      expect(result.status).toBe('INSIDE');
      expect(prisma.accessLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          companyId: ctx.companyId,
          condominiumId: ctx.condominiumId,
          operatorId: ctx.userId,
          status: 'INSIDE',
          entryAt: expect.any(Date),
        }),
      });
    });
  });

  describe('registerExit', () => {
    it('should transition INSIDE to FINISHED with exitAt', async () => {
      const ctx = createTenantCtx();
      const log = createMockAccessLog({ status: 'INSIDE', companyId: ctx.companyId, condominiumId: ctx.condominiumId });
      prisma.accessLog.findFirst.mockResolvedValue(log);
      prisma.accessLog.update.mockResolvedValue({ ...log, status: 'FINISHED', exitAt: new Date() });

      const result = await service.registerExit(log.id, ctx);

      expect(result.status).toBe('FINISHED');
      expect(prisma.accessLog.update).toHaveBeenCalledWith({
        where: { id: log.id },
        data: expect.objectContaining({
          status: 'FINISHED',
          exitAt: expect.any(Date),
          updatedById: ctx.userId,
        }),
      });
    });

    it('should throw NotFoundException if log status is not INSIDE', async () => {
      const ctx = createTenantCtx();
      const log = createMockAccessLog({ status: 'WAITING', companyId: ctx.companyId, condominiumId: ctx.condominiumId });
      prisma.accessLog.findFirst.mockResolvedValue(log);

      await expect(service.registerExit(log.id, ctx)).rejects.toThrow(NotFoundException);
      expect(prisma.accessLog.update).not.toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('should create an access log with status WAITING', async () => {
      const ctx = createTenantCtx();
      const dto = { personName: 'Someone', personType: 'VISITOR' } as any;
      const created = createMockAccessLog({ status: 'WAITING' });
      prisma.accessLog.create.mockResolvedValue(created);

      const result = await service.create(dto, ctx);

      expect(result.status).toBe('WAITING');
      expect(prisma.accessLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          companyId: ctx.companyId,
          condominiumId: ctx.condominiumId,
          operatorId: ctx.userId,
          status: 'WAITING',
        }),
      });
    });
  });

  describe('authorize', () => {
    it('should set status to AUTHORIZED', async () => {
      const ctx = createTenantCtx();
      const log = createMockAccessLog({ companyId: ctx.companyId, condominiumId: ctx.condominiumId });
      prisma.accessLog.findFirst.mockResolvedValue(log);
      prisma.accessLog.update.mockResolvedValue({ ...log, status: 'AUTHORIZED' });

      const result = await service.authorize(log.id, ctx);

      expect(result.status).toBe('AUTHORIZED');
      expect(prisma.accessLog.update).toHaveBeenCalledWith({
        where: { id: log.id },
        data: expect.objectContaining({
          status: 'AUTHORIZED',
          authorizedById: ctx.userId,
          updatedById: ctx.userId,
        }),
      });
    });

    it('should throw NotFoundException if access log does not exist', async () => {
      const ctx = createTenantCtx();
      prisma.accessLog.findFirst.mockResolvedValue(null);

      await expect(service.authorize('bad-id', ctx)).rejects.toThrow(NotFoundException);
    });
  });

  describe('deny', () => {
    it('should set status to DENIED with reason', async () => {
      const ctx = createTenantCtx();
      const log = createMockAccessLog({ companyId: ctx.companyId, condominiumId: ctx.condominiumId });
      const reason = 'Documento invalido';
      prisma.accessLog.findFirst.mockResolvedValue(log);
      prisma.accessLog.update.mockResolvedValue({ ...log, status: 'DENIED', deniedReason: reason });

      const result = await service.deny(log.id, reason, ctx);

      expect(result.status).toBe('DENIED');
      expect(prisma.accessLog.update).toHaveBeenCalledWith({
        where: { id: log.id },
        data: expect.objectContaining({
          status: 'DENIED',
          deniedReason: reason,
          updatedById: ctx.userId,
        }),
      });
    });
  });

  describe('getDashboardSummary', () => {
    it('should return counts for inside, waiting, today entries and exits', async () => {
      const ctx = createTenantCtx();
      prisma.accessLog.count
        .mockResolvedValueOnce(5)   // insideCount
        .mockResolvedValueOnce(3)   // waitingCount
        .mockResolvedValueOnce(12)  // todayEntries
        .mockResolvedValueOnce(8);  // todayExits

      const result = await service.getDashboardSummary(ctx);

      expect(result).toEqual({
        insideCount: 5,
        waitingCount: 3,
        todayEntries: 12,
        todayExits: 8,
      });
      expect(prisma.accessLog.count).toHaveBeenCalledTimes(4);
    });
  });
});
