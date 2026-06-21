import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuditService } from './audit.service';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { TenantContext } from '../common/decorators/current-user.decorator';

@Controller('audit')
@UseGuards(RolesGuard)
@Roles('SUPER_ADMIN', 'COMPANY_ADMIN', 'MANAGER')
export class AuditController {
  constructor(private service: AuditService) {}

  @Get()
  findAll(
    @TenantContext() ctx: any,
    @Query('page') page = '1',
    @Query('limit') limit = '50',
    @Query('entity') entity?: string,
    @Query('userId') userId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.service.findAll(ctx, +page, +limit, entity, userId, dateFrom, dateTo);
  }
}
