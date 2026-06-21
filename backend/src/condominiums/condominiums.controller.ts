import {
  Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards,
} from '@nestjs/common';
import { CondominiumsService } from './condominiums.service';
import { CreateCondominiumDto, UpdateCondominiumDto } from './dto/condominium.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { TenantContext } from '../common/decorators/current-user.decorator';

@Controller('condominiums')
@UseGuards(RolesGuard)
export class CondominiumsController {
  constructor(private service: CondominiumsService) {}

  @Get()
  findAll(
    @TenantContext() ctx: any,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('search') search?: string,
  ) {
    return this.service.findAll(ctx, +page, +limit, search);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @TenantContext() ctx: any) {
    return this.service.findOne(id, ctx);
  }

  @Post()
  @Roles('SUPER_ADMIN', 'COMPANY_ADMIN')
  create(@Body() dto: CreateCondominiumDto, @TenantContext() ctx: any) {
    return this.service.create(dto, ctx);
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN', 'COMPANY_ADMIN', 'MANAGER')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCondominiumDto,
    @TenantContext() ctx: any,
  ) {
    return this.service.update(id, dto, ctx);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN', 'COMPANY_ADMIN')
  remove(@Param('id') id: string, @TenantContext() ctx: any) {
    return this.service.remove(id, ctx);
  }
}
