import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import {
  ChangePasswordDto,
  LoginDto,
  RefreshTokenDto,
  SelectCondominiumDto,
} from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  async login(dto: LoginDto, ip: string, userAgent: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { role: true, condominiums: { include: { condominium: true } } },
    });

    if (!user || user.deletedAt) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    if (!user.isActive) {
      throw new ForbiddenException('Usuário inativo. Contate o administrador.');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date(), lastLoginIp: ip, lastLoginAgent: userAgent },
    });

    // Audit login
    await this.prisma.auditLog.create({
      data: {
        companyId: user.companyId,
        userId: user.id,
        entity: 'User',
        entityId: user.id,
        action: 'LOGIN',
        ip,
        userAgent,
      },
    });

    // SUPER_ADMIN can operate in any condominium across all companies
    let condominiumList: { id: string; name: string; companyId: string }[];
    if (user.role.name === 'SUPER_ADMIN') {
      const allCondos = await this.prisma.condominium.findMany({
        where: { isActive: true, deletedAt: null },
        select: { id: true, name: true, companyId: true },
        orderBy: { name: 'asc' },
      });
      condominiumList = allCondos;
    } else {
      condominiumList = user.condominiums
        .filter((uc) => uc.isActive && !uc.condominium.deletedAt)
        .map((uc) => ({
          id: uc.condominiumId,
          name: uc.condominium.name,
          companyId: uc.condominium.companyId,
        }));
    }

    // If user has exactly one condominium, auto-select it
    const activeCondominiumId =
      condominiumList.length === 1 ? condominiumList[0].id : null;

    // For auto-selected condominium, use the correct companyId
    const effectiveCompanyId =
      activeCondominiumId && condominiumList.length === 1
        ? condominiumList[0].companyId
        : user.companyId;

    const tokens = await this.generateTokens(
      user.id,
      user.email,
      effectiveCompanyId,
      activeCondominiumId,
      user.role.name,
    );

    return {
      ...tokens,
      mustChangePassword: user.mustChangePassword,
      condominiums: condominiumList.map((c) => ({ id: c.id, name: c.name })),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role.name,
        photoUrl: user.photoUrl,
        activeCondominiumId,
      },
    };
  }

  async selectCondominium(userId: string, companyId: string, dto: SelectCondominiumDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user) throw new NotFoundException('Usuário não encontrado');

    let effectiveCompanyId = companyId;

    if (user.role.name === 'SUPER_ADMIN') {
      // SUPER_ADMIN can select any active condominium across all companies
      const condo = await this.prisma.condominium.findUnique({
        where: { id: dto.condominiumId },
      });
      if (!condo || !condo.isActive || condo.deletedAt) {
        throw new ForbiddenException('Condomínio não disponível');
      }
      effectiveCompanyId = condo.companyId;
    } else {
      const link = await this.prisma.userCondominium.findUnique({
        where: { userId_condominiumId: { userId, condominiumId: dto.condominiumId } },
        include: { condominium: true },
      });

      if (!link || !link.isActive || link.condominium.deletedAt) {
        throw new ForbiddenException('Condomínio não disponível para este usuário');
      }

      if (link.condominium.companyId !== companyId) {
        throw new ForbiddenException('Condomínio fora do escopo da empresa');
      }
    }

    return this.generateTokens(
      userId,
      user.email,
      effectiveCompanyId,
      dto.condominiumId,
      user.role.name,
    );
  }

  async refresh(dto: RefreshTokenDto) {
    const stored = await this.prisma.refreshToken.findUnique({
      where: { token: dto.refreshToken },
      include: { user: { include: { role: true } } },
    });

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token inválido ou expirado');
    }

    // Rotate refresh token
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    // Get current condominiumId from old token claims
    let activeCondominiumId: string | null = null;
    try {
      const decoded = this.jwtService.decode(dto.refreshToken) as any;
      activeCondominiumId = decoded?.activeCondominiumId ?? null;
    } catch {
      // ignore
    }

    return this.generateTokens(
      stored.userId,
      stored.user.email,
      stored.user.companyId,
      activeCondominiumId,
      stored.user.role.name,
    );
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuário não encontrado');

    const valid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!valid) throw new BadRequestException('Senha atual incorreta');

    const hash = await bcrypt.hash(dto.newPassword, 12);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: hash, mustChangePassword: false },
    });

    return { message: 'Senha alterada com sucesso' };
  }

  async logout(refreshToken: string) {
    if (refreshToken) {
      await this.prisma.refreshToken
        .update({
          where: { token: refreshToken },
          data: { revokedAt: new Date() },
        })
        .catch(() => null); // ignore if token not found
    }
    return { message: 'Logout realizado com sucesso' };
  }

  private async generateTokens(
    userId: string,
    email: string,
    companyId: string,
    activeCondominiumId: string | null,
    role: string,
  ) {
    const payload = { sub: userId, email, companyId, activeCondominiumId, role };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.config.get('JWT_EXPIRES_IN', '15m'),
    });

    const refreshTokenValue = this.jwtService.sign(payload, {
      secret: this.config.get('JWT_REFRESH_SECRET'),
      expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN', '7d'),
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.refreshToken.create({
      data: {
        userId,
        token: refreshTokenValue,
        expiresAt,
      },
    });

    return { accessToken, refreshToken: refreshTokenValue };
  }
}
