import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateResidentDto, UpdateResidentDto } from './dto/resident.dto';

interface TenantCtx {
  companyId: string;
  condominiumId: string;
  userId: string;
}

@Injectable()
export class ResidentsService {
  constructor(private prisma: PrismaService) {}

  async findAll(ctx: TenantCtx, page = 1, limit = 20, search?: string, unitId?: string) {
    const skip = (page - 1) * limit;
    const where: any = {
      companyId: ctx.companyId,
      condominiumId: ctx.condominiumId,
      deletedAt: null,
      ...(unitId ? { unitId } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { document: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.resident.findMany({
        where,
        skip,
        take: limit,
        include: { unit: true },
        orderBy: { name: 'asc' },
      }),
      this.prisma.resident.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findOne(id: string, ctx: TenantCtx) {
    const resident = await this.prisma.resident.findFirst({
      where: {
        id,
        companyId: ctx.companyId,
        condominiumId: ctx.condominiumId,
        deletedAt: null,
      },
      include: { unit: true, vehicles: { where: { deletedAt: null } } },
    });
    if (!resident) throw new NotFoundException('Morador não encontrado');
    return resident;
  }

  async create(dto: CreateResidentDto, ctx: TenantCtx) {
    return this.prisma.resident.create({
      data: {
        ...dto,
        companyId: ctx.companyId,
        condominiumId: ctx.condominiumId,
        createdById: ctx.userId,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
      include: { unit: true },
    });
  }

  async update(id: string, dto: UpdateResidentDto, ctx: TenantCtx) {
    await this.findOne(id, ctx);
    return this.prisma.resident.update({
      where: { id },
      data: {
        ...dto,
        updatedById: ctx.userId,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
      include: { unit: true },
    });
  }

  async remove(id: string, ctx: TenantCtx) {
    await this.findOne(id, ctx);
    await this.prisma.resident.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false, updatedById: ctx.userId },
    });
    return { message: 'Morador removido com sucesso' };
  }
}
