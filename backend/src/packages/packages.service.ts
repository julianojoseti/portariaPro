import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePackageDto, RetrievePackageDto } from './dto/package.dto';
import { PackageStatus } from '@prisma/client';

interface TenantCtx { companyId: string; condominiumId: string; userId: string }

@Injectable()
export class PackagesService {
  constructor(private prisma: PrismaService) {}

  async findAll(ctx: TenantCtx, page = 1, limit = 20, status?: PackageStatus, unitId?: string) {
    const skip = (page - 1) * limit;
    const where: any = {
      companyId: ctx.companyId,
      condominiumId: ctx.condominiumId,
      deletedAt: null,
      ...(status ? { status } : {}),
      ...(unitId ? { unitId } : {}),
    };
    const [data, total] = await Promise.all([
      this.prisma.packageDelivery.findMany({
        where, skip, take: limit,
        include: { unit: true },
        orderBy: { receivedAt: 'desc' },
      }),
      this.prisma.packageDelivery.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async findOne(id: string, ctx: TenantCtx) {
    const pkg = await this.prisma.packageDelivery.findFirst({
      where: { id, companyId: ctx.companyId, condominiumId: ctx.condominiumId, deletedAt: null },
      include: { unit: true },
    });
    if (!pkg) throw new NotFoundException('Encomenda não encontrada');
    return pkg;
  }

  async create(dto: CreatePackageDto, ctx: TenantCtx) {
    const pkg = await this.prisma.packageDelivery.create({
      data: {
        ...dto,
        companyId: ctx.companyId,
        condominiumId: ctx.condominiumId,
        createdById: ctx.userId,
        status: 'WAITING_PICKUP',
        receivedAt: new Date(),
      },
      include: { unit: true },
    });
    return pkg;
  }

  async retrieve(id: string, dto: RetrievePackageDto, ctx: TenantCtx) {
    await this.findOne(id, ctx);
    return this.prisma.packageDelivery.update({
      where: { id },
      data: {
        status: 'RETRIEVED',
        retrievedAt: new Date(),
        retrievedByName: dto.retrievedByName,
        retrievedById: dto.retrievedById,
        updatedById: ctx.userId,
      },
    });
  }

  async markReturned(id: string, ctx: TenantCtx) {
    await this.findOne(id, ctx);
    return this.prisma.packageDelivery.update({
      where: { id },
      data: { status: 'RETURNED', returnedAt: new Date(), updatedById: ctx.userId },
    });
  }

  async getPendingCount(ctx: TenantCtx) {
    return this.prisma.packageDelivery.count({
      where: {
        companyId: ctx.companyId,
        condominiumId: ctx.condominiumId,
        status: 'WAITING_PICKUP',
        deletedAt: null,
      },
    });
  }
}
