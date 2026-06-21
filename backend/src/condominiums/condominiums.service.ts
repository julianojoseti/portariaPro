import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCondominiumDto, UpdateCondominiumDto } from './dto/condominium.dto';

interface TenantCtx {
  companyId: string;
  condominiumId?: string | null;
  userId: string;
  role: string;
}

@Injectable()
export class CondominiumsService {
  constructor(private prisma: PrismaService) {}

  async findAll(ctx: TenantCtx, page = 1, limit = 20, search?: string) {
    const skip = (page - 1) * limit;
    const where: any = {
      deletedAt: null,
      ...(ctx.role !== 'SUPER_ADMIN' ? { companyId: ctx.companyId } : {}),
      ...(search
        ? { name: { contains: search, mode: 'insensitive' } }
        : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.condominium.findMany({ where, skip, take: limit, orderBy: { name: 'asc' } }),
      this.prisma.condominium.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findOne(id: string, ctx: TenantCtx) {
    const condo = await this.prisma.condominium.findFirst({
      where: {
        id,
        deletedAt: null,
        ...(ctx.role !== 'SUPER_ADMIN' ? { companyId: ctx.companyId } : {}),
      },
      include: { _count: { select: { units: true, residents: true } } },
    });
    if (!condo) throw new NotFoundException('Condomínio não encontrado');
    return condo;
  }

  async create(dto: CreateCondominiumDto, ctx: TenantCtx) {
    return this.prisma.condominium.create({
      data: { ...dto, companyId: ctx.companyId },
    });
  }

  async update(id: string, dto: UpdateCondominiumDto, ctx: TenantCtx) {
    await this.findOne(id, ctx);
    return this.prisma.condominium.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string, ctx: TenantCtx) {
    await this.findOne(id, ctx);
    await this.prisma.condominium.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
    return { message: 'Condomínio removido com sucesso' };
  }
}
