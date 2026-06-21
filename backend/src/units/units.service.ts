import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUnitDto, UpdateUnitDto } from './dto/unit.dto';

interface TenantCtx { companyId: string; condominiumId: string; userId: string }

@Injectable()
export class UnitsService {
  constructor(private prisma: PrismaService) {}

  async findAll(ctx: TenantCtx, page = 1, limit = 50, search?: string, block?: string) {
    const skip = (page - 1) * limit;
    const where: any = {
      companyId: ctx.companyId,
      condominiumId: ctx.condominiumId,
      deletedAt: null,
      ...(block ? { block } : {}),
      ...(search ? { number: { contains: search, mode: 'insensitive' } } : {}),
    };
    const [data, total] = await Promise.all([
      this.prisma.unit.findMany({
        where, skip, take: limit,
        include: { _count: { select: { residents: true } } },
        orderBy: [{ block: 'asc' }, { number: 'asc' }],
      }),
      this.prisma.unit.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async findOne(id: string, ctx: TenantCtx) {
    const unit = await this.prisma.unit.findFirst({
      where: { id, companyId: ctx.companyId, condominiumId: ctx.condominiumId, deletedAt: null },
      include: {
        residents: { where: { deletedAt: null, isActive: true } },
        vehicles: { where: { deletedAt: null } },
      },
    });
    if (!unit) throw new NotFoundException('Unidade não encontrada');
    return unit;
  }

  async create(dto: CreateUnitDto, ctx: TenantCtx) {
    return this.prisma.unit.create({
      data: { ...dto, companyId: ctx.companyId, condominiumId: ctx.condominiumId, createdById: ctx.userId },
    });
  }

  async update(id: string, dto: UpdateUnitDto, ctx: TenantCtx) {
    await this.findOne(id, ctx);
    return this.prisma.unit.update({ where: { id }, data: { ...dto, updatedById: ctx.userId } });
  }

  async remove(id: string, ctx: TenantCtx) {
    await this.findOne(id, ctx);
    await this.prisma.unit.update({ where: { id }, data: { deletedAt: new Date(), isActive: false } });
    return { message: 'Unidade removida com sucesso' };
  }

  async getBlocks(ctx: TenantCtx) {
    const blocks = await this.prisma.unit.findMany({
      where: { companyId: ctx.companyId, condominiumId: ctx.condominiumId, deletedAt: null, block: { not: null } },
      distinct: ['block'],
      select: { block: true },
      orderBy: { block: 'asc' },
    });
    return blocks.map((b) => b.block).filter(Boolean);
  }
}
