import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CondominiumsService } from './condominiums.service';
import { PrismaService } from '../prisma/prisma.service';
import { createMockPrismaService } from '../test/prisma-mock.factory';
import { createTenantCtx, createMockCondominium } from '../test/fixtures.factory';

describe('CondominiumsService', () => {
  let service: CondominiumsService;
  let prisma: ReturnType<typeof createMockPrismaService>;

  beforeEach(async () => {
    prisma = createMockPrismaService();
    const module = await Test.createTestingModule({
      providers: [
        CondominiumsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get(CondominiumsService);
  });

  describe('findAll', () => {
    it('should scope by companyId for non-SUPER_ADMIN role', async () => {
      const ctx = createTenantCtx({ role: 'COMPANY_ADMIN' });
      prisma.condominium.findMany.mockResolvedValue([]);
      prisma.condominium.count.mockResolvedValue(0);

      await service.findAll(ctx);

      expect(prisma.condominium.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ companyId: ctx.companyId, deletedAt: null }),
        }),
      );
    });

    it('should NOT scope by companyId for SUPER_ADMIN', async () => {
      const ctx = createTenantCtx({ role: 'SUPER_ADMIN' });
      prisma.condominium.findMany.mockResolvedValue([]);
      prisma.condominium.count.mockResolvedValue(0);

      await service.findAll(ctx);

      const calledWhere = prisma.condominium.findMany.mock.calls[0][0].where;
      expect(calledWhere).not.toHaveProperty('companyId');
      expect(calledWhere).toHaveProperty('deletedAt', null);
    });

    it('should apply search filter', async () => {
      const ctx = createTenantCtx();
      prisma.condominium.findMany.mockResolvedValue([]);
      prisma.condominium.count.mockResolvedValue(0);

      await service.findAll(ctx, 1, 20, 'residencial');

      expect(prisma.condominium.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            name: { contains: 'residencial', mode: 'insensitive' },
          }),
        }),
      );
    });

    it('should return paginated result', async () => {
      const ctx = createTenantCtx();
      const condos = [createMockCondominium(), createMockCondominium()];
      prisma.condominium.findMany.mockResolvedValue(condos);
      prisma.condominium.count.mockResolvedValue(2);

      const result = await service.findAll(ctx, 1, 20);

      expect(result).toEqual({ data: condos, total: 2, page: 1, limit: 20 });
    });
  });

  describe('findOne', () => {
    it('should return condominium scoped by companyId for non-SUPER_ADMIN', async () => {
      const ctx = createTenantCtx({ role: 'COMPANY_ADMIN' });
      const condo = createMockCondominium({ companyId: ctx.companyId });
      prisma.condominium.findFirst.mockResolvedValue(condo);

      const result = await service.findOne(condo.id, ctx);

      expect(result.id).toBe(condo.id);
      expect(prisma.condominium.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: condo.id, companyId: ctx.companyId }),
        }),
      );
    });

    it('should bypass companyId filter for SUPER_ADMIN', async () => {
      const ctx = createTenantCtx({ role: 'SUPER_ADMIN' });
      const condo = createMockCondominium();
      prisma.condominium.findFirst.mockResolvedValue(condo);

      await service.findOne(condo.id, ctx);

      const calledWhere = prisma.condominium.findFirst.mock.calls[0][0].where;
      expect(calledWhere).not.toHaveProperty('companyId');
    });

    it('should throw NotFoundException when not found', async () => {
      const ctx = createTenantCtx();
      prisma.condominium.findFirst.mockResolvedValue(null);

      await expect(service.findOne('bad-id', ctx)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a condominium with company context', async () => {
      const ctx = createTenantCtx();
      const dto = { name: 'Condo Novo', address: 'Rua A, 123', city: 'SP', state: 'SP' };
      const created = createMockCondominium({ ...dto, companyId: ctx.companyId });
      prisma.condominium.create.mockResolvedValue(created);

      const result = await service.create(dto as any, ctx);

      expect(result.id).toBe(created.id);
      expect(prisma.condominium.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ companyId: ctx.companyId, name: dto.name }),
      });
    });
  });

  describe('update', () => {
    it('should validate existence then update', async () => {
      const ctx = createTenantCtx();
      const condo = createMockCondominium({ companyId: ctx.companyId });
      const dto = { name: 'Novo Nome' };
      prisma.condominium.findFirst.mockResolvedValue(condo);
      prisma.condominium.update.mockResolvedValue({ ...condo, ...dto });

      const result = await service.update(condo.id, dto as any, ctx);

      expect(result.name).toBe('Novo Nome');
      expect(prisma.condominium.update).toHaveBeenCalledWith({
        where: { id: condo.id },
        data: dto,
      });
    });

    it('should throw NotFoundException if condominium does not exist', async () => {
      const ctx = createTenantCtx();
      prisma.condominium.findFirst.mockResolvedValue(null);

      await expect(service.update('bad-id', { name: 'X' } as any, ctx)).rejects.toThrow(NotFoundException);
      expect(prisma.condominium.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should soft delete the condominium', async () => {
      const ctx = createTenantCtx();
      const condo = createMockCondominium({ companyId: ctx.companyId });
      prisma.condominium.findFirst.mockResolvedValue(condo);
      prisma.condominium.update.mockResolvedValue(condo);

      const result = await service.remove(condo.id, ctx);

      expect(result.message).toBe('Condomínio removido com sucesso');
      expect(prisma.condominium.update).toHaveBeenCalledWith({
        where: { id: condo.id },
        data: expect.objectContaining({ deletedAt: expect.any(Date), isActive: false }),
      });
    });

    it('should throw NotFoundException if condominium does not exist', async () => {
      const ctx = createTenantCtx();
      prisma.condominium.findFirst.mockResolvedValue(null);

      await expect(service.remove('bad-id', ctx)).rejects.toThrow(NotFoundException);
    });
  });
});
