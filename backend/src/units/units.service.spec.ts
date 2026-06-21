import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UnitsService } from './units.service';
import { PrismaService } from '../prisma/prisma.service';
import { createMockPrismaService } from '../test/prisma-mock.factory';
import { createTenantCtx, createMockUnit } from '../test/fixtures.factory';

describe('UnitsService', () => {
  let service: UnitsService;
  let prisma: ReturnType<typeof createMockPrismaService>;

  beforeEach(async () => {
    prisma = createMockPrismaService();
    const module = await Test.createTestingModule({
      providers: [
        UnitsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get(UnitsService);
  });

  describe('findAll', () => {
    it('should return paginated units scoped by tenant', async () => {
      const ctx = createTenantCtx();
      const units = [createMockUnit({ companyId: ctx.companyId, condominiumId: ctx.condominiumId })];
      prisma.unit.findMany.mockResolvedValue(units);
      prisma.unit.count.mockResolvedValue(1);

      const result = await service.findAll(ctx);

      expect(result).toEqual({ data: units, total: 1, page: 1, limit: 50 });
      expect(prisma.unit.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            companyId: ctx.companyId,
            condominiumId: ctx.condominiumId,
            deletedAt: null,
          }),
        }),
      );
    });

    it('should filter by block when provided', async () => {
      const ctx = createTenantCtx();
      prisma.unit.findMany.mockResolvedValue([]);
      prisma.unit.count.mockResolvedValue(0);

      await service.findAll(ctx, 1, 50, undefined, 'B');

      expect(prisma.unit.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ block: 'B' }),
        }),
      );
    });

    it('should filter by search on number', async () => {
      const ctx = createTenantCtx();
      prisma.unit.findMany.mockResolvedValue([]);
      prisma.unit.count.mockResolvedValue(0);

      await service.findAll(ctx, 1, 50, '101');

      expect(prisma.unit.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            number: { contains: '101', mode: 'insensitive' },
          }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return the unit', async () => {
      const ctx = createTenantCtx();
      const unit = createMockUnit({ companyId: ctx.companyId, condominiumId: ctx.condominiumId });
      prisma.unit.findFirst.mockResolvedValue(unit);

      const result = await service.findOne(unit.id, ctx);

      expect(result.id).toBe(unit.id);
      expect(prisma.unit.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: unit.id, companyId: ctx.companyId, condominiumId: ctx.condominiumId, deletedAt: null },
        }),
      );
    });

    it('should throw NotFoundException when unit not found', async () => {
      const ctx = createTenantCtx();
      prisma.unit.findFirst.mockResolvedValue(null);

      await expect(service.findOne('bad-id', ctx)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a unit with tenant context', async () => {
      const ctx = createTenantCtx();
      const dto = { block: 'A', number: '101', type: 'apartment', floor: 1, parkingSpots: 1 };
      const created = createMockUnit({ ...dto, companyId: ctx.companyId, condominiumId: ctx.condominiumId });
      prisma.unit.create.mockResolvedValue(created);

      const result = await service.create(dto as any, ctx);

      expect(result.id).toBe(created.id);
      expect(prisma.unit.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          companyId: ctx.companyId,
          condominiumId: ctx.condominiumId,
          createdById: ctx.userId,
        }),
      });
    });
  });

  describe('update', () => {
    it('should validate existence then update', async () => {
      const ctx = createTenantCtx();
      const unit = createMockUnit({ companyId: ctx.companyId, condominiumId: ctx.condominiumId });
      const dto = { number: '202' };
      prisma.unit.findFirst.mockResolvedValue(unit);
      prisma.unit.update.mockResolvedValue({ ...unit, ...dto });

      const result = await service.update(unit.id, dto as any, ctx);

      expect(result.number).toBe('202');
      expect(prisma.unit.update).toHaveBeenCalledWith({
        where: { id: unit.id },
        data: expect.objectContaining({ number: '202', updatedById: ctx.userId }),
      });
    });

    it('should throw NotFoundException if unit does not exist', async () => {
      const ctx = createTenantCtx();
      prisma.unit.findFirst.mockResolvedValue(null);

      await expect(service.update('bad-id', {} as any, ctx)).rejects.toThrow(NotFoundException);
      expect(prisma.unit.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should soft delete the unit', async () => {
      const ctx = createTenantCtx();
      const unit = createMockUnit({ companyId: ctx.companyId, condominiumId: ctx.condominiumId });
      prisma.unit.findFirst.mockResolvedValue(unit);
      prisma.unit.update.mockResolvedValue(unit);

      const result = await service.remove(unit.id, ctx);

      expect(result.message).toBe('Unidade removida com sucesso');
      expect(prisma.unit.update).toHaveBeenCalledWith({
        where: { id: unit.id },
        data: expect.objectContaining({ deletedAt: expect.any(Date), isActive: false }),
      });
    });
  });

  describe('getBlocks', () => {
    it('should return distinct block names', async () => {
      const ctx = createTenantCtx();
      prisma.unit.findMany.mockResolvedValue([{ block: 'A' }, { block: 'B' }, { block: 'C' }]);

      const result = await service.getBlocks(ctx);

      expect(result).toEqual(['A', 'B', 'C']);
      expect(prisma.unit.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          distinct: ['block'],
          select: { block: true },
        }),
      );
    });

    it('should filter out null/falsy block values', async () => {
      const ctx = createTenantCtx();
      prisma.unit.findMany.mockResolvedValue([{ block: 'A' }, { block: null }, { block: '' }]);

      const result = await service.getBlocks(ctx);

      expect(result).toEqual(['A']);
    });
  });
});
