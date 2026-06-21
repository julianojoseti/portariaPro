import { Test } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { createMockPrismaService } from '../test/prisma-mock.factory';
import { createTenantCtx, createMockUser } from '../test/fixtures.factory';

jest.mock('bcryptjs');

describe('UsersService', () => {
  let service: UsersService;
  let prisma: ReturnType<typeof createMockPrismaService>;

  beforeEach(async () => {
    prisma = createMockPrismaService();
    const module = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get(UsersService);
  });

  describe('findAll', () => {
    it('should return paginated users', async () => {
      const ctx = createTenantCtx();
      const users = [createMockUser({ companyId: ctx.companyId }), createMockUser({ companyId: ctx.companyId })];
      prisma.user.findMany.mockResolvedValue(users);
      prisma.user.count.mockResolvedValue(2);

      const result = await service.findAll(ctx, 1, 20);

      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.data).toHaveLength(2);
      // sanitize strips passwordHash
      result.data.forEach((u) => expect(u).not.toHaveProperty('passwordHash'));
      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ companyId: ctx.companyId, deletedAt: null }),
          skip: 0,
          take: 20,
        }),
      );
    });

    it('should apply search filter', async () => {
      const ctx = createTenantCtx();
      prisma.user.findMany.mockResolvedValue([]);
      prisma.user.count.mockResolvedValue(0);

      await service.findAll(ctx, 1, 20, 'john');

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { name: { contains: 'john', mode: 'insensitive' } },
              { email: { contains: 'john', mode: 'insensitive' } },
            ],
          }),
        }),
      );
    });

    it('should calculate correct skip for page > 1', async () => {
      const ctx = createTenantCtx();
      prisma.user.findMany.mockResolvedValue([]);
      prisma.user.count.mockResolvedValue(0);

      await service.findAll(ctx, 3, 10);

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 20, take: 10 }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a user without passwordHash', async () => {
      const ctx = createTenantCtx();
      const user = createMockUser({ companyId: ctx.companyId });
      prisma.user.findFirst.mockResolvedValue(user);

      const result = await service.findOne(user.id, ctx);

      expect(result).not.toHaveProperty('passwordHash');
      expect(result.id).toBe(user.id);
      expect(prisma.user.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: user.id, companyId: ctx.companyId, deletedAt: null },
        }),
      );
    });

    it('should throw NotFoundException when user not found', async () => {
      const ctx = createTenantCtx();
      prisma.user.findFirst.mockResolvedValue(null);

      await expect(service.findOne('non-existent', ctx)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should hash password and create user', async () => {
      const ctx = createTenantCtx();
      const dto = { name: 'John', email: 'john@test.com', password: 'secret123', roleId: 'role-1', phone: '123' };
      const createdUser = createMockUser({ ...dto, companyId: ctx.companyId });

      prisma.user.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('$2a$12$hashed');
      prisma.user.create.mockResolvedValue(createdUser);

      const result = await service.create(dto, ctx);

      expect(bcrypt.hash).toHaveBeenCalledWith('secret123', 12);
      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            companyId: ctx.companyId,
            email: dto.email,
            passwordHash: '$2a$12$hashed',
            mustChangePassword: true,
          }),
        }),
      );
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('should throw ConflictException for duplicate email', async () => {
      const ctx = createTenantCtx();
      const dto = { name: 'John', email: 'john@test.com', password: 'secret123', roleId: 'role-1' };
      prisma.user.findUnique.mockResolvedValue(createMockUser({ email: dto.email }));

      await expect(service.create(dto, ctx)).rejects.toThrow(ConflictException);
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('should create UserCondominium link if condominiumId provided', async () => {
      const ctx = createTenantCtx();
      const condoId = 'condo-123';
      const dto = { name: 'Jane', email: 'jane@test.com', password: 'pass', roleId: 'role-1', condominiumId: condoId };
      const createdUser = createMockUser({ id: 'user-new', companyId: ctx.companyId });

      prisma.user.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('$2a$12$hashed');
      prisma.user.create.mockResolvedValue(createdUser);
      prisma.userCondominium.create.mockResolvedValue({});

      await service.create(dto, ctx);

      expect(prisma.userCondominium.create).toHaveBeenCalledWith({
        data: {
          userId: createdUser.id,
          condominiumId: condoId,
          companyId: ctx.companyId,
        },
      });
    });

    it('should NOT create UserCondominium link if condominiumId not provided', async () => {
      const ctx = createTenantCtx();
      const dto = { name: 'Jane', email: 'jane@test.com', password: 'pass', roleId: 'role-1' };
      prisma.user.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('$2a$12$hashed');
      prisma.user.create.mockResolvedValue(createMockUser({ companyId: ctx.companyId }));

      await service.create(dto, ctx);

      expect(prisma.userCondominium.create).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should validate existence then update', async () => {
      const ctx = createTenantCtx();
      const user = createMockUser({ companyId: ctx.companyId });
      const dto = { name: 'Updated Name' };

      prisma.user.findFirst.mockResolvedValue(user);
      prisma.user.update.mockResolvedValue({ ...user, ...dto });

      const result = await service.update(user.id, dto, ctx);

      expect(prisma.user.findFirst).toHaveBeenCalled();
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: user.id },
          data: expect.objectContaining({ name: 'Updated Name' }),
        }),
      );
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('should throw NotFoundException if user does not exist', async () => {
      const ctx = createTenantCtx();
      prisma.user.findFirst.mockResolvedValue(null);

      await expect(service.update('bad-id', { name: 'X' }, ctx)).rejects.toThrow(NotFoundException);
      expect(prisma.user.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should soft delete the user', async () => {
      const ctx = createTenantCtx();
      const user = createMockUser({ companyId: ctx.companyId });
      prisma.user.findFirst.mockResolvedValue(user);
      prisma.user.update.mockResolvedValue(user);

      const result = await service.remove(user.id, ctx);

      expect(result.message).toBe('Usuário removido com sucesso');
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: user.id },
        data: expect.objectContaining({ deletedAt: expect.any(Date), isActive: false }),
      });
    });

    it('should throw NotFoundException if user does not exist', async () => {
      const ctx = createTenantCtx();
      prisma.user.findFirst.mockResolvedValue(null);

      await expect(service.remove('bad-id', ctx)).rejects.toThrow(NotFoundException);
    });
  });

  describe('assignCondominium', () => {
    it('should upsert a UserCondominium record', async () => {
      const ctx = createTenantCtx();
      const user = createMockUser({ companyId: ctx.companyId });
      const dto = { condominiumId: 'condo-1' };
      prisma.user.findFirst.mockResolvedValue(user);
      prisma.userCondominium.upsert.mockResolvedValue({});

      const result = await service.assignCondominium(user.id, dto, ctx);

      expect(result.message).toBe('Condomínio vinculado com sucesso');
      expect(prisma.userCondominium.upsert).toHaveBeenCalledWith({
        where: { userId_condominiumId: { userId: user.id, condominiumId: dto.condominiumId } },
        create: expect.objectContaining({ userId: user.id, condominiumId: dto.condominiumId, companyId: ctx.companyId, isActive: true }),
        update: { isActive: true },
      });
    });
  });

  describe('removeCondominium', () => {
    it('should deactivate the UserCondominium link', async () => {
      const ctx = createTenantCtx();
      const user = createMockUser({ companyId: ctx.companyId });
      prisma.user.findFirst.mockResolvedValue(user);
      prisma.userCondominium.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.removeCondominium(user.id, 'condo-1', ctx);

      expect(result.message).toBe('Condomínio desvinculado com sucesso');
      expect(prisma.userCondominium.updateMany).toHaveBeenCalledWith({
        where: { userId: user.id, condominiumId: 'condo-1' },
        data: { isActive: false },
      });
    });
  });
});
