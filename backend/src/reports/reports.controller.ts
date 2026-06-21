import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { TenantContext } from '../common/decorators/current-user.decorator';

@Controller('reports')
@UseGuards(RolesGuard)
@Roles('SUPER_ADMIN', 'COMPANY_ADMIN', 'MANAGER')
export class ReportsController {
  constructor(private prisma: PrismaService) {}

  @Get('access-by-period')
  async accessByPeriod(
    @TenantContext() ctx: any,
    @Query('dateFrom') dateFrom: string,
    @Query('dateTo') dateTo: string,
  ) {
    const base = { companyId: ctx.companyId, condominiumId: ctx.condominiumId };
    const dateFilter = {
      createdAt: {
        gte: dateFrom ? new Date(dateFrom) : undefined,
        lte: dateTo ? new Date(dateTo) : undefined,
      },
    };

    const [entries, exits, denied] = await Promise.all([
      this.prisma.accessLog.count({ where: { ...base, ...dateFilter, status: { in: ['INSIDE', 'FINISHED'] } } }),
      this.prisma.accessLog.count({ where: { ...base, ...dateFilter, status: 'FINISHED' } }),
      this.prisma.accessLog.count({ where: { ...base, ...dateFilter, status: 'DENIED' } }),
    ]);

    return { entries, exits, denied };
  }

  @Get('packages')
  async packages(
    @TenantContext() ctx: any,
    @Query('dateFrom') dateFrom: string,
    @Query('dateTo') dateTo: string,
  ) {
    const base = { companyId: ctx.companyId, condominiumId: ctx.condominiumId, deletedAt: null };
    const dateFilter = {
      receivedAt: {
        gte: dateFrom ? new Date(dateFrom) : undefined,
        lte: dateTo ? new Date(dateTo) : undefined,
      },
    };
    const [received, retrieved, pending, returned] = await Promise.all([
      this.prisma.packageDelivery.count({ where: { ...base, ...dateFilter } }),
      this.prisma.packageDelivery.count({ where: { ...base, ...dateFilter, status: 'RETRIEVED' } }),
      this.prisma.packageDelivery.count({ where: { ...base, status: 'WAITING_PICKUP' } }),
      this.prisma.packageDelivery.count({ where: { ...base, ...dateFilter, status: 'RETURNED' } }),
    ]);
    return { received, retrieved, pending, returned };
  }

  @Get('occurrences')
  async occurrences(
    @TenantContext() ctx: any,
    @Query('dateFrom') dateFrom: string,
    @Query('dateTo') dateTo: string,
  ) {
    const base = { companyId: ctx.companyId, condominiumId: ctx.condominiumId, deletedAt: null };
    const dateFilter = {
      createdAt: {
        gte: dateFrom ? new Date(dateFrom) : undefined,
        lte: dateTo ? new Date(dateTo) : undefined,
      },
    };
    return this.prisma.occurrence.groupBy({
      by: ['status'],
      where: { ...base, ...dateFilter },
      _count: true,
    });
  }

  @Get('visitors-by-unit')
  async visitorsByUnit(
    @TenantContext() ctx: any,
    @Query('dateFrom') dateFrom: string,
    @Query('dateTo') dateTo: string,
    @Query('limit') limit = '10',
  ) {
    const base = { companyId: ctx.companyId, condominiumId: ctx.condominiumId };
    const dateFilter = {
      createdAt: {
        gte: dateFrom ? new Date(dateFrom) : undefined,
        lte: dateTo ? new Date(dateTo) : undefined,
      },
    };
    return this.prisma.accessLog.groupBy({
      by: ['unitId'],
      where: { ...base, ...dateFilter, unitId: { not: null } },
      _count: true,
      orderBy: { _count: { unitId: 'desc' } },
      take: +limit,
    });
  }
}
