import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateAccessLogDto,
  RegisterEntryDto,
  UpdateAccessStatusDto,
} from './dto/access-log.dto';
import { AccessStatus } from '@prisma/client';

interface TenantCtx {
  companyId: string;
  condominiumId: string;
  userId: string;
}

@Injectable()
export class AccessLogsService {
  constructor(private prisma: PrismaService) {}

  async findAll(
    ctx: TenantCtx,
    page = 1,
    limit = 20,
    filters: {
      search?: string;
      status?: AccessStatus;
      personType?: string;
      unitId?: string;
      dateFrom?: string;
      dateTo?: string;
    } = {},
  ) {
    const skip = (page - 1) * limit;
    const where: any = {
      companyId: ctx.companyId,
      condominiumId: ctx.condominiumId,
    };

    if (filters.status) where.status = filters.status;
    if (filters.personType) where.personType = filters.personType;
    if (filters.unitId) where.unitId = filters.unitId;
    if (filters.search) {
      where.OR = [
        { personName: { contains: filters.search, mode: 'insensitive' } },
        { personDocument: { contains: filters.search, mode: 'insensitive' } },
        { vehiclePlate: { contains: filters.search, mode: 'insensitive' } },
      ];
    }
    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) where.createdAt.gte = new Date(filters.dateFrom);
      if (filters.dateTo) where.createdAt.lte = new Date(filters.dateTo);
    }

    const [data, total] = await Promise.all([
      this.prisma.accessLog.findMany({
        where,
        skip,
        take: limit,
        include: { visitor: true, serviceProvider: true, operator: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.accessLog.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findInsideNow(ctx: TenantCtx) {
    return this.prisma.accessLog.findMany({
      where: {
        companyId: ctx.companyId,
        condominiumId: ctx.condominiumId,
        status: 'INSIDE',
      },
      include: { visitor: true, serviceProvider: true },
      orderBy: { entryAt: 'asc' },
    });
  }

  async findOne(id: string, ctx: TenantCtx) {
    const log = await this.prisma.accessLog.findFirst({
      where: { id, companyId: ctx.companyId, condominiumId: ctx.condominiumId },
      include: {
        visitor: true,
        serviceProvider: true,
        operator: { select: { id: true, name: true } },
      },
    });
    if (!log) throw new NotFoundException('Registro de acesso não encontrado');
    return log;
  }

  async registerEntry(dto: RegisterEntryDto, ctx: TenantCtx) {
    return this.prisma.accessLog.create({
      data: {
        companyId: ctx.companyId,
        condominiumId: ctx.condominiumId,
        operatorId: ctx.userId,
        createdById: ctx.userId,
        status: 'INSIDE',
        entryAt: new Date(),
        ...dto,
        unitId: dto.unitId,
        visitorId: dto.visitorId,
        serviceProviderId: dto.serviceProviderId,
      },
    });
  }

  async registerExit(id: string, ctx: TenantCtx) {
    const log = await this.findOne(id, ctx);
    if (log.status !== 'INSIDE') {
      throw new NotFoundException('Registro não está com status "Dentro"');
    }
    return this.prisma.accessLog.update({
      where: { id },
      data: { status: 'FINISHED', exitAt: new Date(), updatedById: ctx.userId },
    });
  }

  async create(dto: CreateAccessLogDto, ctx: TenantCtx) {
    return this.prisma.accessLog.create({
      data: {
        companyId: ctx.companyId,
        condominiumId: ctx.condominiumId,
        operatorId: ctx.userId,
        createdById: ctx.userId,
        status: 'WAITING',
        ...dto,
      },
    });
  }

  async updateStatus(id: string, dto: UpdateAccessStatusDto, ctx: TenantCtx) {
    await this.findOne(id, ctx);
    return this.prisma.accessLog.update({
      where: { id },
      data: {
        ...dto,
        entryAt: dto.entryAt ? new Date(dto.entryAt) : undefined,
        exitAt: dto.exitAt ? new Date(dto.exitAt) : undefined,
        updatedById: ctx.userId,
      },
    });
  }

  async authorize(id: string, ctx: TenantCtx) {
    await this.findOne(id, ctx);
    return this.prisma.accessLog.update({
      where: { id },
      data: { status: 'AUTHORIZED', authorizedById: ctx.userId, updatedById: ctx.userId },
    });
  }

  async deny(id: string, reason: string, ctx: TenantCtx) {
    await this.findOne(id, ctx);
    return this.prisma.accessLog.update({
      where: { id },
      data: { status: 'DENIED', deniedReason: reason, updatedById: ctx.userId },
    });
  }

  async getDashboardSummary(ctx: TenantCtx) {
    const [insideCount, waitingCount, todayEntries, todayExits] =
      await Promise.all([
        this.prisma.accessLog.count({
          where: { companyId: ctx.companyId, condominiumId: ctx.condominiumId, status: 'INSIDE' },
        }),
        this.prisma.accessLog.count({
          where: { companyId: ctx.companyId, condominiumId: ctx.condominiumId, status: 'WAITING' },
        }),
        this.prisma.accessLog.count({
          where: {
            companyId: ctx.companyId,
            condominiumId: ctx.condominiumId,
            entryAt: { gte: this.startOfDay() },
          },
        }),
        this.prisma.accessLog.count({
          where: {
            companyId: ctx.companyId,
            condominiumId: ctx.condominiumId,
            exitAt: { gte: this.startOfDay() },
          },
        }),
      ]);

    return { insideCount, waitingCount, todayEntries, todayExits };
  }

  private startOfDay() {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }
}
