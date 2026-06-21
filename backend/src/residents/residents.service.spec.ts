import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ResidentsService } from './residents.service';
import { PrismaService } from '../prisma/prisma.service';
import { createMockPrismaService } from '../test/prisma-mock.factory';
import { createTenantCtx, createMockResident } from '../test/fixtures.factory';

describe('ResidentsService', () => {
  let service: ResidentsService;
  let prisma: ReturnType<typeof createMockPrismaService>;

  beforeEach(async () => {
    prisma = createMockPrismaService();
    const module = await Test.createTestingModule({
      providers: [
        ResidentsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get(ResidentsService);
  });

  describe('findAll', () => {
    it('should return paginated residents scoped by company and condominium', async () => {
      const ctx = createTenantCtx();
      const residents = [createMockResident({ companyId: ctx.companyId, condominiumId: ctx.condominiumId })];
      prisma.resident.findMany.mockResolvedValue(residents);
      prisma.resident.count.mockResolvedValue(1);

      const result = await service.findAll(ctx);

      expect(result).toEqual({ data: residents, total: 1, page: 1, limit: 20 });
      expect(prisma.resident.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            companyId: ctx.companyId,
            condominiumId: ctx.condominiumId,
            deletedAt: null,
          }),
        }),
      );
    });

    it('should apply search filter across name, document and email', async () => {
      const ctx = createTenantCtx();
      prisma.resident.findMany.mockResolvedValue([]);
      prisma.resident.count.mockResolvedValue(0);

      await service.findAll(ctx, 1, 20, 'silva');

      expect(prisma.resident.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { name: { contains: 'silva', mode: 'insensitive' } },
              { document: { contains: 'silva', mode: 'insensitive' } },
              { email: { contains: 'silva', mode: 'insensitive' } },
            ],
          }),
        }),
      );
    });

    it('should filter by unitId when provided', async () => {
      const ctx = createTenantCtx();
      const unitId = 'unit-123';
      prisma.resident.findMany.mockResolvedValue([]);
      prisma.resident.count.mockResolvedValue(0);

      await service.findAll(ctx, 1, 20, undefined, unitId);

      expect(prisma.resident.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ unitId }),
        }),
      );
    });

    it('should calculate correct skip for pagination', async () => {
      const ctx = createTenantCtx();
      prisma.resident.findMany.mockResolvedValue([]);
      prisma.resident.count.mockResolvedValue(0);

      await service.findAll(ctx, 3, 10);

      expect(prisma.resident.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 20, take: 10 }),
      );
    });
  });

  describe('findOne', () => {
    it('should return the resident scoped by tenant', async () => {
      const ctx = createTenantCtx();
      const resident = createMockResident({ companyId: ctx.companyId, condominiumId: ctx.condominiumId });
      prisma.resident.findFirst.mockResolvedValue(resident);

      const result = await service.findOne(resident.id, ctx);

      expect(result.id).toBe(resident.id);
      expect(prisma.resident.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: resident.id, companyId: ctx.companyId, condominiumId: ctx.condominiumId, deletedAt: null },
        }),
      );
    });

    it('should throw NotFoundException when resident not found', async () => {
      const ctx = createTenantCtx();
      prisma.resident.findFirst.mockResolvedValue(null);

      await expect(service.findOne('bad-id', ctx)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create resident with tenant context and parse dates', async () => {
      const ctx = createTenantCtx();
      const dto = { name: 'Maria', unitId: 'unit-1', document: '12345678900', type: 'OWNER', startDate: '2024-01-01' } as any;
      const created = createMockResident({ ...dto, companyId: ctx.companyId, condominiumId: ctx.condominiumId });
      prisma.resident.create.mockResolvedValue(created);

      const result = await service.create(dto, ctx);

      expect(result.id).toBe(created.id);
      expect(prisma.resident.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            companyId: ctx.companyId,
            condominiumId: ctx.condominiumId,
            createdById: ctx.userId,
            startDate: expect.any(Date),
          }),
        }),
      );
    });

    it('should leave startDate undefined when not provided', async () => {
      const ctx = createTenantCtx();
      const dto = { name: 'Maria', unitId: 'unit-1', document: '12345678900', type: 'OWNER' } as any;
      prisma.resident.create.mockResolvedValue(createMockResident());

      await service.create(dto, ctx);

      expect(prisma.resident.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ startDate: undefined }),
        }),
      );
    });
  });

  describe('update', () => {
    it('should validate existence then update with parsed dates', async () => {
      const ctx = createTenantCtx();
      const resident = createMockResident({ companyId: ctx.companyId, condominiumId: ctx.condominiumId });
      const dto = { name: 'Updated', endDate: '2025-12-31' } as any;
      prisma.resident.findFirst.mockResolvedValue(resident);
      prisma.resident.update.mockResolvedValue({ ...resident, ...dto });

      await service.update(resident.id, dto, ctx);

      expect(prisma.resident.findFirst).toHaveBeenCalled();
      expect(prisma.resident.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: resident.id },
          data: expect.objectContaining({
            updatedById: ctx.userId,
            endDate: expect.any(Date),
          }),
        }),
      );
    });

    it('should throw NotFoundException if resident does not exist', async () => {
      const ctx = createTenantCtx();
      prisma.resident.findFirst.mockResolvedValue(null);

      await expect(service.update('bad-id', { name: 'X' } as any, ctx)).rejects.toThrow(NotFoundException);
      expect(prisma.resident.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should soft delete the resident', async () => {
      const ctx = createTenantCtx();
      const resident = createMockResident({ companyId: ctx.companyId, condominiumId: ctx.condominiumId });
      prisma.resident.findFirst.mockResolvedValue(resident);
      prisma.resident.update.mockResolvedValue(resident);

      const result = await service.remove(resident.id, ctx);

      expect(result.message).toBe('Morador removido com sucesso');
      expect(prisma.resident.update).toHaveBeenCalledWith({
        where: { id: resident.id },
        data: expect.objectContaining({ deletedAt: expect.any(Date), isActive: false, updatedById: ctx.userId }),
      });
    });

    it('should throw NotFoundException if resident does not exist', async () => {
      const ctx = createTenantCtx();
      prisma.resident.findFirst.mockResolvedValue(null);

      await expect(service.remove('bad-id', ctx)).rejects.toThrow(NotFoundException);
    });
  });
});
