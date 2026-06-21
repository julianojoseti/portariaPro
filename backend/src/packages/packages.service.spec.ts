import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PackagesService } from './packages.service';
import { PrismaService } from '../prisma/prisma.service';
import { createMockPrismaService } from '../test/prisma-mock.factory';
import { createTenantCtx, createMockPackage } from '../test/fixtures.factory';

describe('PackagesService', () => {
  let service: PackagesService;
  let prisma: ReturnType<typeof createMockPrismaService>;

  beforeEach(async () => {
    prisma = createMockPrismaService();
    const module = await Test.createTestingModule({
      providers: [
        PackagesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get(PackagesService);
  });

  describe('findAll', () => {
    it('should return paginated packages scoped by tenant', async () => {
      const ctx = createTenantCtx();
      const packages = [createMockPackage({ companyId: ctx.companyId, condominiumId: ctx.condominiumId })];
      prisma.packageDelivery.findMany.mockResolvedValue(packages);
      prisma.packageDelivery.count.mockResolvedValue(1);

      const result = await service.findAll(ctx);

      expect(result).toEqual({ data: packages, total: 1, page: 1, limit: 20 });
      expect(prisma.packageDelivery.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            companyId: ctx.companyId,
            condominiumId: ctx.condominiumId,
            deletedAt: null,
          }),
        }),
      );
    });

    it('should filter by status', async () => {
      const ctx = createTenantCtx();
      prisma.packageDelivery.findMany.mockResolvedValue([]);
      prisma.packageDelivery.count.mockResolvedValue(0);

      await service.findAll(ctx, 1, 20, 'WAITING_PICKUP' as any);

      expect(prisma.packageDelivery.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'WAITING_PICKUP' }),
        }),
      );
    });

    it('should filter by unitId', async () => {
      const ctx = createTenantCtx();
      prisma.packageDelivery.findMany.mockResolvedValue([]);
      prisma.packageDelivery.count.mockResolvedValue(0);

      await service.findAll(ctx, 1, 20, undefined, 'unit-1');

      expect(prisma.packageDelivery.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ unitId: 'unit-1' }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return the package', async () => {
      const ctx = createTenantCtx();
      const pkg = createMockPackage({ companyId: ctx.companyId, condominiumId: ctx.condominiumId });
      prisma.packageDelivery.findFirst.mockResolvedValue(pkg);

      const result = await service.findOne(pkg.id, ctx);

      expect(result.id).toBe(pkg.id);
      expect(prisma.packageDelivery.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: pkg.id, companyId: ctx.companyId, condominiumId: ctx.condominiumId, deletedAt: null },
        }),
      );
    });

    it('should throw NotFoundException when package not found', async () => {
      const ctx = createTenantCtx();
      prisma.packageDelivery.findFirst.mockResolvedValue(null);

      await expect(service.findOne('bad-id', ctx)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a package with WAITING_PICKUP status and receivedAt', async () => {
      const ctx = createTenantCtx();
      const dto = { unitId: 'unit-1', recipientName: 'Joao', carrier: 'Correios' } as any;
      const created = createMockPackage({ ...dto, status: 'WAITING_PICKUP' });
      prisma.packageDelivery.create.mockResolvedValue(created);

      const result = await service.create(dto, ctx);

      expect(result.status).toBe('WAITING_PICKUP');
      expect(prisma.packageDelivery.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            companyId: ctx.companyId,
            condominiumId: ctx.condominiumId,
            createdById: ctx.userId,
            status: 'WAITING_PICKUP',
            receivedAt: expect.any(Date),
          }),
        }),
      );
    });
  });

  describe('retrieve', () => {
    it('should set status to RETRIEVED with retrieval details', async () => {
      const ctx = createTenantCtx();
      const pkg = createMockPackage({ companyId: ctx.companyId, condominiumId: ctx.condominiumId });
      const dto = { retrievedByName: 'Maria', retrievedById: 'resident-1' };
      prisma.packageDelivery.findFirst.mockResolvedValue(pkg);
      prisma.packageDelivery.update.mockResolvedValue({ ...pkg, status: 'RETRIEVED', ...dto });

      const result = await service.retrieve(pkg.id, dto, ctx);

      expect(result.status).toBe('RETRIEVED');
      expect(prisma.packageDelivery.update).toHaveBeenCalledWith({
        where: { id: pkg.id },
        data: expect.objectContaining({
          status: 'RETRIEVED',
          retrievedAt: expect.any(Date),
          retrievedByName: 'Maria',
          retrievedById: 'resident-1',
          updatedById: ctx.userId,
        }),
      });
    });

    it('should throw NotFoundException if package does not exist', async () => {
      const ctx = createTenantCtx();
      prisma.packageDelivery.findFirst.mockResolvedValue(null);

      await expect(service.retrieve('bad-id', { retrievedByName: 'X' } as any, ctx)).rejects.toThrow(NotFoundException);
      expect(prisma.packageDelivery.update).not.toHaveBeenCalled();
    });
  });

  describe('markReturned', () => {
    it('should set status to RETURNED with returnedAt', async () => {
      const ctx = createTenantCtx();
      const pkg = createMockPackage({ companyId: ctx.companyId, condominiumId: ctx.condominiumId });
      prisma.packageDelivery.findFirst.mockResolvedValue(pkg);
      prisma.packageDelivery.update.mockResolvedValue({ ...pkg, status: 'RETURNED' });

      const result = await service.markReturned(pkg.id, ctx);

      expect(result.status).toBe('RETURNED');
      expect(prisma.packageDelivery.update).toHaveBeenCalledWith({
        where: { id: pkg.id },
        data: expect.objectContaining({
          status: 'RETURNED',
          returnedAt: expect.any(Date),
          updatedById: ctx.userId,
        }),
      });
    });
  });

  describe('getPendingCount', () => {
    it('should return count of WAITING_PICKUP packages', async () => {
      const ctx = createTenantCtx();
      prisma.packageDelivery.count.mockResolvedValue(7);

      const result = await service.getPendingCount(ctx);

      expect(result).toBe(7);
      expect(prisma.packageDelivery.count).toHaveBeenCalledWith({
        where: {
          companyId: ctx.companyId,
          condominiumId: ctx.condominiumId,
          status: 'WAITING_PICKUP',
          deletedAt: null,
        },
      });
    });
  });
});
