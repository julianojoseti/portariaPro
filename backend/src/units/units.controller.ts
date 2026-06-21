import {
  Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards,
} from '@nestjs/common';
import { UnitsService } from './units.service';
import { CreateUnitDto, UpdateUnitDto } from './dto/unit.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { TenantContext } from '../common/decorators/current-user.decorator';

@Controller('units')
@UseGuards(RolesGuard)
export class UnitsController {
  constructor(private service: UnitsService) {}

  @Get()
  findAll(
    @TenantContext() ctx: any,
    @Query('page') page = '1',
    @Query('limit') limit = '50',
    @Query('search') search?: string,
    @Query('block') block?: string,
  ) {
    return this.service.findAll(ctx, +page, +limit, search, block);
  }

  @Get('blocks')
  getBlocks(@TenantContext() ctx: any) {
    return this.service.getBlocks(ctx);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @TenantContext() ctx: any) {
    return this.service.findOne(id, ctx);
  }

  @Post()
  @Roles('SUPER_ADMIN', 'COMPANY_ADMIN', 'MANAGER')
  create(@Body() dto: CreateUnitDto, @TenantContext() ctx: any) {
    return this.service.create(dto, ctx);
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN', 'COMPANY_ADMIN', 'MANAGER')
  update(@Param('id') id: string, @Body() dto: UpdateUnitDto, @TenantContext() ctx: any) {
    return this.service.update(id, dto, ctx);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN', 'COMPANY_ADMIN', 'MANAGER')
  remove(@Param('id') id: string, @TenantContext() ctx: any) {
    return this.service.remove(id, ctx);
  }
}
