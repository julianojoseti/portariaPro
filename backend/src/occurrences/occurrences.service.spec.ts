import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { OccurrencesService } from './occurrences.service';
import { PrismaService } from '../prisma/prisma.service';
import { createMockPrismaService } from '../test/prisma-mock.factory';
import { createTenantCtx, createMockOccurrence } from '../test/fixtures.factory';

describe('OccurrencesService', () => {
  let service: OccurrencesService;
  let prisma: ReturnType<typeof createMockPrismaService>;

  beforeEach(async () => {
    prisma = createMockPrismaService();
    const module = await Test.createTestingModule({
      providers: [
        OccurrencesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get(OccurrencesService);
  });

  describe('findAll', () => {
    it('should return paginated occurrences scoped by tenant', async () => {
      const ctx = createTenantCtx();
      const occurrences = [createMockOccurrence({ companyId: ctx.companyId, condominiumId: ctx.condominiumId })];
      prisma.occurrence.findMany.mockResolvedValue(occurrences);
      prisma.occurrence.count.mockResolvedValue(1);

      const result = await service.findAll(ctx);

      expect(result).toEqual({ data: occurrences, total: 1, page: 1, limit: 20 });
      expect(prisma.occurrence.findMany).toHaveBeenCalledWith(
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
      prisma.occurrence.findMany.mockResolvedValue([]);
      prisma.occurrence.count.mockResolvedValue(0);

      await service.findAll(ctx, 1, 20, 'OPEN' as any);

      expect(prisma.occurrence.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'OPEN' }),
        }),
      );
    });

    it('should apply search filter across title and description', async () => {
      const ctx = createTenantCtx();
      prisma.occurrence.findMany.mockResolvedValue([]);
      prisma.occurrence.count.mockResolvedValue(0);

      await service.findAll(ctx, 1, 20, undefined, 'barulho');

      expect(prisma.occurrence.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { title: { contains: 'barulho', mode: 'insensitive' } },
              { description: { contains: 'barulho', mode: 'insensitive' } },
            ],
          }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return the occurrence', async () => {
      const ctx = createTenantCtx();
      const occ = createMockOccurrence({ companyId: ctx.companyId, condominiumId: ctx.condominiumId });
      prisma.occurrence.findFirst.mockResolvedValue(occ);

      const result = await service.findOne(occ.id, ctx);

      expect(result.id).toBe(occ.id);
    });

    it('should throw NotFoundException when not found', async () => {
      const ctx = createTenantCtx();
      prisma.occurrence.findFirst.mockResolvedValue(null);

      await expect(service.findOne('bad-id', ctx)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create an occurrence with reportedById and createdById from ctx', async () => {
      const ctx = createTenantCtx();
      const dto = { title: 'Barulho', description: 'Muito barulho', type: 'NOISE', priority: 'MEDIUM' } as any;
      const created = createMockOccurrence({ ...dto, reportedById: ctx.userId });
      prisma.occurrence.create.mockResolvedValue(created);

      const result = await service.create(dto, ctx);

      expect(result.reportedById).toBe(ctx.userId);
      expect(prisma.occurrence.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          companyId: ctx.companyId,
          condominiumId: ctx.condominiumId,
          reportedById: ctx.userId,
          createdById: ctx.userId,
        }),
      });
    });
  });

  describe('update', () => {
    it('should validate existence then update', async () => {
      const ctx = createTenantCtx();
      const occ = createMockOccurrence({ companyId: ctx.companyId, condominiumId: ctx.condominiumId });
      const dto = { priority: 'HIGH' } as any;
      prisma.occurrence.findFirst.mockResolvedValue(occ);
      prisma.occurrence.update.mockResolvedValue({ ...occ, ...dto });

      await service.update(occ.id, dto, ctx);

      expect(prisma.occurrence.update).toHaveBeenCalledWith({
        where: { id: occ.id },
        data: expect.objectContaining({ priority: 'HIGH', updatedById: ctx.userId }),
      });
    });

    it('should set resolvedAt when status is RESOLVED', async () => {
      const ctx = createTenantCtx();
      const occ = createMockOccurrence({ companyId: ctx.companyId, condominiumId: ctx.condominiumId });
      const dto = { status: 'RESOLVED' } as any;
      prisma.occurrence.findFirst.mockResolvedValue(occ);
      prisma.occurrence.update.mockResolvedValue({ ...occ, status: 'RESOLVED', resolvedAt: new Date() });

      await service.update(occ.id, dto, ctx);

      expect(prisma.occurrence.update).toHaveBeenCalledWith({
        where: { id: occ.id },
        data: expect.objectContaining({
          status: 'RESOLVED',
          resolvedAt: expect.any(Date),
          updatedById: ctx.userId,
        }),
      });
    });

    it('should NOT set resolvedAt when status is not RESOLVED', async () => {
      const ctx = createTenantCtx();
      const occ = createMockOccurrence({ companyId: ctx.companyId, condominiumId: ctx.condominiumId });
      const dto = { status: 'IN_PROGRESS' } as any;
      prisma.occurrence.findFirst.mockResolvedValue(occ);
      prisma.occurrence.update.mockResolvedValue({ ...occ, ...dto });

      await service.update(occ.id, dto, ctx);

      const calledData = prisma.occurrence.update.mock.calls[0][0].data;
      expect(calledData).not.toHaveProperty('resolvedAt');
    });

    it('should throw NotFoundException if occurrence does not exist', async () => {
      const ctx = createTenantCtx();
      prisma.occurrence.findFirst.mockResolvedValue(null);

      await expect(service.update('bad-id', {} as any, ctx)).rejects.toThrow(NotFoundException);
      expect(prisma.occurrence.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should soft delete the occurrence', async () => {
      const ctx = createTenantCtx();
      const occ = createMockOccurrence({ companyId: ctx.companyId, condominiumId: ctx.condominiumId });
      prisma.occurrence.findFirst.mockResolvedValue(occ);
      prisma.occurrence.update.mockResolvedValue(occ);

      const result = await service.remove(occ.id, ctx);

      expect(result.message).toBe('Ocorrência removida com sucesso');
      expect(prisma.occurrence.update).toHaveBeenCalledWith({
        where: { id: occ.id },
        data: expect.objectContaining({ deletedAt: expect.any(Date), updatedById: ctx.userId }),
      });
    });

    it('should throw NotFoundException if occurrence does not exist', async () => {
      const ctx = createTenantCtx();
      prisma.occurrence.findFirst.mockResolvedValue(null);

      await expect(service.remove('bad-id', ctx)).rejects.toThrow(NotFoundException);
    });
  });

  describe('addComment', () => {
    it('should create an OccurrenceComment linked to the occurrence', async () => {
      const ctx = createTenantCtx();
      const occ = createMockOccurrence({ companyId: ctx.companyId, condominiumId: ctx.condominiumId });
      const dto = { content: 'Comentario de teste' };
      prisma.occurrence.findFirst.mockResolvedValue(occ);
      const comment = { id: 'comment-1', occurrenceId: occ.id, userId: ctx.userId, content: dto.content, createdAt: new Date() };
      prisma.occurrenceComment.create.mockResolvedValue(comment);

      const result = await service.addComment(occ.id, dto, ctx);

      expect(result).toEqual(comment);
      expect(prisma.occurrenceComment.create).toHaveBeenCalledWith({
        data: { occurrenceId: occ.id, userId: ctx.userId, content: dto.content },
      });
    });

    it('should throw NotFoundException if occurrence does not exist', async () => {
      const ctx = createTenantCtx();
      prisma.occurrence.findFirst.mockResolvedValue(null);

      await expect(service.addComment('bad-id', { content: 'X' }, ctx)).rejects.toThrow(NotFoundException);
      expect(prisma.occurrenceComment.create).not.toHaveBeenCalled();
    });
  });

  describe('getOpenCount', () => {
    it('should return count of OPEN occurrences', async () => {
      const ctx = createTenantCtx();
      prisma.occurrence.count.mockResolvedValue(4);

      const result = await service.getOpenCount(ctx);

      expect(result).toBe(4);
      expect(prisma.occurrence.count).toHaveBeenCalledWith({
        where: {
          companyId: ctx.companyId,
          condominiumId: ctx.condominiumId,
          status: 'OPEN',
          deletedAt: null,
        },
      });
    });
  });
});
