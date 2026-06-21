import {
  Body, Controller, Get, Param, Patch, Post, Query,
} from '@nestjs/common';
import { PackagesService } from './packages.service';
import { CreatePackageDto, RetrievePackageDto } from './dto/package.dto';
import { TenantContext } from '../common/decorators/current-user.decorator';
import { PackageStatus } from '@prisma/client';

@Controller('packages')
export class PackagesController {
  constructor(private service: PackagesService) {}

  @Get()
  findAll(
    @TenantContext() ctx: any,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('status') status?: PackageStatus,
    @Query('unitId') unitId?: string,
  ) {
    return this.service.findAll(ctx, +page, +limit, status, unitId);
  }

  @Get('pending-count')
  pendingCount(@TenantContext() ctx: any) {
    return this.service.getPendingCount(ctx);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @TenantContext() ctx: any) {
    return this.service.findOne(id, ctx);
  }

  @Post()
  create(@Body() dto: CreatePackageDto, @TenantContext() ctx: any) {
    return this.service.create(dto, ctx);
  }

  @Patch(':id/retrieve')
  retrieve(
    @Param('id') id: string,
    @Body() dto: RetrievePackageDto,
    @TenantContext() ctx: any,
  ) {
    return this.service.retrieve(id, dto, ctx);
  }

  @Patch(':id/return')
  markReturned(@Param('id') id: string, @TenantContext() ctx: any) {
    return this.service.markReturned(id, ctx);
  }
}
