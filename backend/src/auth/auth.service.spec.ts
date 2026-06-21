import { Test, TestingModule } from '@nestjs/testing';
import {
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';

jest.mock('bcryptjs');

const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('AuthService', () => {
  let service: AuthService;
  let prisma: Record<string, any>;
  let jwtService: { sign: jest.Mock; decode: jest.Mock };
  let configService: { get: jest.Mock };

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
    passwordHash: 'hashed-password',
    isActive: true,
    deletedAt: null,
    companyId: 'company-1',
    mustChangePassword: false,
    photoUrl: null,
    lastLoginAt: null,
    lastLoginIp: null,
    lastLoginAgent: null,
    role: { id: 'role-1', name: 'ADMIN' },
    condominiums: [
      {
        condominiumId: 'condo-1',
        isActive: true,
        condominium: {
          id: 'condo-1',
          name: 'Condo Alpha',
          companyId: 'company-1',
          isActive: true,
          deletedAt: null,
        },
      },
    ],
  };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      auditLog: {
        create: jest.fn(),
      },
      refreshToken: {
        findUnique: jest.fn(),
        update: jest.fn(),
        create: jest.fn(),
      },
      condominium: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
      userCondominium: {
        findUnique: jest.fn(),
      },
    };

    jwtService = {
      sign: jest.fn().mockReturnValue('mock-token'),
      decode: jest.fn(),
    };

    configService = {
      get: jest.fn().mockImplementation((key: string, defaultValue?: string) => {
        const values: Record<string, string> = {
          JWT_EXPIRES_IN: '15m',
          JWT_REFRESH_SECRET: 'test-refresh-secret',
          JWT_REFRESH_EXPIRES_IN: '7d',
        };
        return values[key] ?? defaultValue;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);

    jest.clearAllMocks();

    // Reset bcrypt mocks with defaults
    mockedBcrypt.compare.mockResolvedValue(true as never);
    mockedBcrypt.hash.mockResolvedValue('new-hashed-password' as never);

    // Default prisma mocks
    prisma.user.update.mockResolvedValue({});
    prisma.auditLog.create.mockResolvedValue({});
    prisma.refreshToken.create.mockResolvedValue({});
    prisma.refreshToken.update.mockResolvedValue({});
  });

  // ─── login() ───────────────────────────────────────────────────────────────

  describe('login()', () => {
    const loginDto = { email: 'test@example.com', password: 'secret123' };
    const ip = '127.0.0.1';
    const userAgent = 'jest-test';

    it('should return accessToken, refreshToken, user and condominiums for valid credentials', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.login(loginDto, ip, userAgent);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('condominiums');
      expect(result.user.email).toBe(mockUser.email);
      expect(result.condominiums).toEqual([{ id: 'condo-1', name: 'Condo Alpha' }]);

      // Verify interactions
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: loginDto.email },
        include: { role: true, condominiums: { include: { condominium: true } } },
      });
      expect(mockedBcrypt.compare).toHaveBeenCalledWith(loginDto.password, mockUser.passwordHash);
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockUser.id },
          data: expect.objectContaining({ lastLoginIp: ip, lastLoginAgent: userAgent }),
        }),
      );
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: mockUser.id,
            action: 'LOGIN',
            entity: 'User',
            ip,
            userAgent,
          }),
        }),
      );
      expect(prisma.refreshToken.create).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when user is not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.login(loginDto, ip, userAgent)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(loginDto, ip, userAgent)).rejects.toThrow(
        'Credenciais inválidas',
      );
    });

    it('should throw UnauthorizedException when user is deleted', async () => {
      prisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        deletedAt: new Date(),
      });

      await expect(service.login(loginDto, ip, userAgent)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw ForbiddenException when user is inactive', async () => {
      prisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        isActive: false,
      });

      await expect(service.login(loginDto, ip, userAgent)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(service.login(loginDto, ip, userAgent)).rejects.toThrow(
        'Usuário inativo',
      );
    });

    it('should throw UnauthorizedException when password is wrong', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockResolvedValue(false as never);

      await expect(service.login(loginDto, ip, userAgent)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should auto-select condominiumId when user has exactly one condominium', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.login(loginDto, ip, userAgent);

      expect(result.user.activeCondominiumId).toBe('condo-1');

      // Token payload should include the condominiumId
      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({ activeCondominiumId: 'condo-1' }),
        expect.any(Object),
      );
    });

    it('should set activeCondominiumId to null when user has multiple condominiums', async () => {
      const userWithMultipleCondos = {
        ...mockUser,
        condominiums: [
          {
            condominiumId: 'condo-1',
            isActive: true,
            condominium: {
              id: 'condo-1',
              name: 'Condo Alpha',
              companyId: 'company-1',
              isActive: true,
              deletedAt: null,
            },
          },
          {
            condominiumId: 'condo-2',
            isActive: true,
            condominium: {
              id: 'condo-2',
              name: 'Condo Beta',
              companyId: 'company-1',
              isActive: true,
              deletedAt: null,
            },
          },
        ],
      };
      prisma.user.findUnique.mockResolvedValue(userWithMultipleCondos);

      const result = await service.login(loginDto, ip, userAgent);

      expect(result.user.activeCondominiumId).toBeNull();
      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({ activeCondominiumId: null }),
        expect.any(Object),
      );
    });

    it('should fetch all active condominiums for SUPER_ADMIN', async () => {
      const superAdminUser = {
        ...mockUser,
        role: { id: 'role-sa', name: 'SUPER_ADMIN' },
        condominiums: [],
      };
      prisma.user.findUnique.mockResolvedValue(superAdminUser);
      prisma.condominium.findMany.mockResolvedValue([
        { id: 'condo-1', name: 'Condo Alpha', companyId: 'company-1' },
        { id: 'condo-2', name: 'Condo Beta', companyId: 'company-2' },
      ]);

      const result = await service.login(loginDto, ip, userAgent);

      expect(prisma.condominium.findMany).toHaveBeenCalledWith({
        where: { isActive: true, deletedAt: null },
        select: { id: true, name: true, companyId: true },
        orderBy: { name: 'asc' },
      });
      expect(result.condominiums).toHaveLength(2);
      expect(result.user.activeCondominiumId).toBeNull();
    });
  });

  // ─── selectCondominium() ──────────────────────────────────────────────────

  describe('selectCondominium()', () => {
    const userId = 'user-1';
    const companyId = 'company-1';
    const dto = { condominiumId: 'condo-1' };

    it('should generate new tokens for a normal user with valid link', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: userId,
        email: 'test@example.com',
        companyId,
        role: { name: 'ADMIN' },
      });
      prisma.userCondominium.findUnique.mockResolvedValue({
        userId,
        condominiumId: 'condo-1',
        isActive: true,
        condominium: {
          id: 'condo-1',
          name: 'Condo Alpha',
          companyId,
          isActive: true,
          deletedAt: null,
        },
      });

      const result = await service.selectCondominium(userId, companyId, dto);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: userId,
          activeCondominiumId: 'condo-1',
          role: 'ADMIN',
        }),
        expect.any(Object),
      );
    });

    it('should throw ForbiddenException when user has no link to condominium', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: userId,
        email: 'test@example.com',
        companyId,
        role: { name: 'ADMIN' },
      });
      prisma.userCondominium.findUnique.mockResolvedValue(null);

      await expect(
        service.selectCondominium(userId, companyId, dto),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow SUPER_ADMIN to select any active condominium', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: userId,
        email: 'test@example.com',
        companyId,
        role: { name: 'SUPER_ADMIN' },
      });
      prisma.condominium.findUnique.mockResolvedValue({
        id: 'condo-other',
        companyId: 'company-other',
        isActive: true,
        deletedAt: null,
      });

      const result = await service.selectCondominium(userId, companyId, {
        condominiumId: 'condo-other',
      });

      expect(result).toHaveProperty('accessToken');
      // Should use the condominium's companyId, not the user's
      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({ companyId: 'company-other' }),
        expect.any(Object),
      );
      // Should NOT check userCondominium
      expect(prisma.userCondominium.findUnique).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException when condominium is inactive', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: userId,
        email: 'test@example.com',
        companyId,
        role: { name: 'SUPER_ADMIN' },
      });
      prisma.condominium.findUnique.mockResolvedValue({
        id: 'condo-1',
        companyId,
        isActive: false,
        deletedAt: null,
      });

      await expect(
        service.selectCondominium(userId, companyId, dto),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ─── refresh() ─────────────────────────────────────────────────────────────

  describe('refresh()', () => {
    const dto = { refreshToken: 'valid-refresh-token' };

    const mockStoredToken = {
      id: 'rt-1',
      token: 'valid-refresh-token',
      userId: 'user-1',
      revokedAt: null,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      user: {
        id: 'user-1',
        email: 'test@example.com',
        companyId: 'company-1',
        role: { name: 'ADMIN' },
      },
    };

    it('should revoke old token and generate new tokens for a valid refresh token', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue(mockStoredToken);
      jwtService.decode.mockReturnValue({
        sub: 'user-1',
        activeCondominiumId: 'condo-1',
      });

      const result = await service.refresh(dto);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');

      // Old token revoked
      expect(prisma.refreshToken.update).toHaveBeenCalledWith({
        where: { id: mockStoredToken.id },
        data: { revokedAt: expect.any(Date) },
      });

      // New token created
      expect(prisma.refreshToken.create).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when token is revoked', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue({
        ...mockStoredToken,
        revokedAt: new Date(),
      });

      await expect(service.refresh(dto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when token is expired', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue({
        ...mockStoredToken,
        expiresAt: new Date(Date.now() - 1000), // 1 second ago
      });

      await expect(service.refresh(dto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when token is not found', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue(null);

      await expect(service.refresh(dto)).rejects.toThrow(UnauthorizedException);
    });
  });

  // ─── changePassword() ─────────────────────────────────────────────────────

  describe('changePassword()', () => {
    const userId = 'user-1';
    const dto = { currentPassword: 'old-pass', newPassword: 'new-pass-123' };

    it('should update password and set mustChangePassword to false', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: userId,
        passwordHash: 'hashed-old',
      });
      prisma.user.update.mockResolvedValue({});

      const result = await service.changePassword(userId, dto);

      expect(result).toEqual({ message: 'Senha alterada com sucesso' });
      expect(mockedBcrypt.compare).toHaveBeenCalledWith(dto.currentPassword, 'hashed-old');
      expect(mockedBcrypt.hash).toHaveBeenCalledWith(dto.newPassword, 12);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { passwordHash: 'new-hashed-password', mustChangePassword: false },
      });
    });

    it('should throw BadRequestException when current password is wrong', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: userId,
        passwordHash: 'hashed-old',
      });
      mockedBcrypt.compare.mockResolvedValue(false as never);

      await expect(service.changePassword(userId, dto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.changePassword(userId, dto)).rejects.toThrow(
        'Senha atual incorreta',
      );
    });

    it('should throw NotFoundException when user is not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.changePassword(userId, dto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── logout() ──────────────────────────────────────────────────────────────

  describe('logout()', () => {
    it('should revoke the refresh token', async () => {
      prisma.refreshToken.update.mockResolvedValue({});

      const result = await service.logout('some-refresh-token');

      expect(result).toEqual({ message: 'Logout realizado com sucesso' });
      expect(prisma.refreshToken.update).toHaveBeenCalledWith({
        where: { token: 'some-refresh-token' },
        data: { revokedAt: expect.any(Date) },
      });
    });

    it('should not throw when token is not found', async () => {
      prisma.refreshToken.update.mockRejectedValue(new Error('Not found'));

      const result = await service.logout('nonexistent-token');

      expect(result).toEqual({ message: 'Logout realizado com sucesso' });
    });
  });
});
