import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import {
  AssignCondominiumDto,
  CreateUserDto,
  UpdateUserDto,
} from './dto/user.dto';

interface TenantCtx {
  companyId: string;
  condominiumId?: string | null;
  userId: string;
}

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(ctx: TenantCtx, page = 1, limit = 20, search?: string) {
    const skip = (page - 1) * limit;
    const where: any = {
      companyId: ctx.companyId,
      deletedAt: null,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        include: { role: true },
        orderBy: { name: 'asc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { data: data.map(this.sanitize), total, page, limit };
  }

  async findOne(id: string, ctx: TenantCtx) {
    const user = await this.prisma.user.findFirst({
      where: { id, companyId: ctx.companyId, deletedAt: null },
      include: {
        role: true,
        condominiums: { include: { condominium: true }, where: { isActive: true } },
      },
    });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    return this.sanitize(user);
  }

  async create(dto: CreateUserDto, ctx: TenantCtx) {
    const exists = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (exists) throw new ConflictException('E-mail já cadastrado');

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        companyId: ctx.companyId,
        roleId: dto.roleId,
        name: dto.name,
        email: dto.email,
        passwordHash,
        phone: dto.phone,
        mustChangePassword: true,
      },
      include: { role: true },
    });

    if (dto.condominiumId) {
      await this.prisma.userCondominium.create({
        data: {
          userId: user.id,
          condominiumId: dto.condominiumId,
          companyId: ctx.companyId,
        },
      });
    }

    return this.sanitize(user);
  }

  async update(id: string, dto: UpdateUserDto, ctx: TenantCtx) {
    await this.findOne(id, ctx);

    const updated = await this.prisma.user.update({
      where: { id },
      data: { ...dto, updatedAt: new Date() },
      include: { role: true },
    });

    return this.sanitize(updated);
  }

  async remove(id: string, ctx: TenantCtx) {
    await this.findOne(id, ctx);
    await this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
    return { message: 'Usuário removido com sucesso' };
  }

  async assignCondominium(
    id: string,
    dto: AssignCondominiumDto,
    ctx: TenantCtx,
  ) {
    await this.findOne(id, ctx);

    await this.prisma.userCondominium.upsert({
      where: { userId_condominiumId: { userId: id, condominiumId: dto.condominiumId } },
      create: {
        userId: id,
        condominiumId: dto.condominiumId,
        companyId: ctx.companyId,
        isActive: true,
      },
      update: { isActive: true },
    });

    return { message: 'Condomínio vinculado com sucesso' };
  }

  async removeCondominium(id: string, condominiumId: string, ctx: TenantCtx) {
    await this.findOne(id, ctx);
    await this.prisma.userCondominium.updateMany({
      where: { userId: id, condominiumId },
      data: { isActive: false },
    });
    return { message: 'Condomínio desvinculado com sucesso' };
  }

  private sanitize(user: any) {
    const { passwordHash, ...safe } = user;
    return safe;
  }
}
