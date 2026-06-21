import { Controller, Get } from '@nestjs/common';
import { TenantContext } from '../common/decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async getSummary(@TenantContext() ctx: any) {
    const { companyId, condominiumId } = ctx;
    if (!condominiumId) {
      return { error: 'Selecione um condomínio para ver o dashboard' };
    }

    const base = { companyId, condominiumId };

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [
      insideNow,
      waitingAccess,
      pendingPackages,
      openOccurrences,
      todayEntries,
      recentAccess,
    ] = await Promise.all([
      this.prisma.accessLog.count({ where: { ...base, status: 'INSIDE' } }),
      this.prisma.accessLog.count({ where: { ...base, status: 'WAITING' } }),
      this.prisma.packageDelivery.count({ where: { ...base, status: 'WAITING_PICKUP', deletedAt: null } }),
      this.prisma.occurrence.count({ where: { ...base, status: 'OPEN', deletedAt: null } }),
      this.prisma.accessLog.count({ where: { ...base, entryAt: { gte: startOfDay } } }),
      this.prisma.accessLog.findMany({
        where: { ...base },
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { visitor: true, serviceProvider: true },
      }),
    ]);

    return {
      insideNow,
      waitingAccess,
      pendingPackages,
      openOccurrences,
      todayEntries,
      recentAccess,
    };
  }
}
