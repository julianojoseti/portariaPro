import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  AddCommentDto,
  CreateOccurrenceDto,
  UpdateOccurrenceDto,
} from './dto/occurrence.dto';
import { OccurrenceStatus } from '@prisma/client';

interface TenantCtx { companyId: string; condominiumId: string; userId: string }

@Injectable()
export class OccurrencesService {
  constructor(private prisma: PrismaService) {}

  async findAll(ctx: TenantCtx, page = 1, limit = 20, status?: OccurrenceStatus, search?: string) {
    const skip = (page - 1) * limit;
    const where: any = {
      companyId: ctx.companyId,
      condominiumId: ctx.condominiumId,
      deletedAt: null,
      ...(status ? { status } : {}),
      ...(search
        ? { OR: [{ title: { contains: search, mode: 'insensitive' } }, { description: { contains: search, mode: 'insensitive' } }] }
        : {}),
    };
    const [data, total] = await Promise.all([
      this.prisma.occurrence.findMany({
        where, skip, take: limit,
        include: { unit: true, reportedBy: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.occurrence.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async findOne(id: string, ctx: TenantCtx) {
    const occ = await this.prisma.occurrence.findFirst({
      where: { id, companyId: ctx.companyId, condominiumId: ctx.condominiumId, deletedAt: null },
      include: {
        unit: true,
        reportedBy: { select: { id: true, name: true } },
        attachments: true,
        comments: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!occ) throw new NotFoundException('Ocorrência não encontrada');
    return occ;
  }

  async create(dto: CreateOccurrenceDto, ctx: TenantCtx) {
    return this.prisma.occurrence.create({
      data: {
        ...dto,
        companyId: ctx.companyId,
        condominiumId: ctx.condominiumId,
        reportedById: ctx.userId,
        createdById: ctx.userId,
      },
    });
  }

  async update(id: string, dto: UpdateOccurrenceDto, ctx: TenantCtx) {
    await this.findOne(id, ctx);
    return this.prisma.occurrence.update({
      where: { id },
      data: {
        ...dto,
        ...(dto.status === 'RESOLVED' ? { resolvedAt: new Date() } : {}),
        updatedById: ctx.userId,
      },
    });
  }

  async remove(id: string, ctx: TenantCtx) {
    await this.findOne(id, ctx);
    await this.prisma.occurrence.update({
      where: { id }, data: { deletedAt: new Date(), updatedById: ctx.userId },
    });
    return { message: 'Ocorrência removida com sucesso' };
  }

  async addComment(id: string, dto: AddCommentDto, ctx: TenantCtx) {
    await this.findOne(id, ctx);
    return this.prisma.occurrenceComment.create({
      data: { occurrenceId: id, userId: ctx.userId, content: dto.content },
    });
  }

  async getOpenCount(ctx: TenantCtx) {
    return this.prisma.occurrence.count({
      where: { companyId: ctx.companyId, condominiumId: ctx.condominiumId, status: 'OPEN', deletedAt: null },
    });
  }
}
