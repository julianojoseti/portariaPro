import {
  Body, Controller, Delete, Get, Param, Patch,
  Post, Query, UseGuards,
} from '@nestjs/common';
import { ResidentsService } from './residents.service';
import { CreateResidentDto, UpdateResidentDto } from './dto/resident.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { TenantContext } from '../common/decorators/current-user.decorator';

@Controller('residents')
@UseGuards(RolesGuard)
export class ResidentsController {
  constructor(private service: ResidentsService) {}

  @Get()
  findAll(
    @TenantContext() ctx: any,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('search') search?: string,
    @Query('unitId') unitId?: string,
  ) {
    return this.service.findAll(ctx, +page, +limit, search, unitId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @TenantContext() ctx: any) {
    return this.service.findOne(id, ctx);
  }

  @Post()
  @Roles('SUPER_ADMIN', 'COMPANY_ADMIN', 'MANAGER', 'DOORMAN')
  create(@Body() dto: CreateResidentDto, @TenantContext() ctx: any) {
    return this.service.create(dto, ctx);
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN', 'COMPANY_ADMIN', 'MANAGER', 'DOORMAN')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateResidentDto,
    @TenantContext() ctx: any,
  ) {
    return this.service.update(id, dto, ctx);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN', 'COMPANY_ADMIN', 'MANAGER')
  remove(@Param('id') id: string, @TenantContext() ctx: any) {
    return this.service.remove(id, ctx);
  }
}
