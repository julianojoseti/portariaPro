import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface TenantCtx { companyId: string; condominiumId: string; userId: string }

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async findAll(ctx: TenantCtx, page = 1, limit = 50, entity?: string, userId?: string, dateFrom?: string, dateTo?: string) {
    const skip = (page - 1) * limit;
    const where: any = {
      companyId: ctx.companyId,
      condominiumId: ctx.condominiumId,
      ...(entity ? { entity } : {}),
      ...(userId ? { userId } : {}),
    };
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }
    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where, skip, take: limit,
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.auditLog.count({ where }),
    ]);
    return { data, total, page, limit };
  }
}
