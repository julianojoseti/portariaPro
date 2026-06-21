import {
  Body, Controller, Get, Param, Patch, Post,
  Query,
} from '@nestjs/common';
import { AccessLogsService } from './access-logs.service';
import {
  CreateAccessLogDto,
  RegisterEntryDto,
  UpdateAccessStatusDto,
} from './dto/access-log.dto';
import { TenantContext } from '../common/decorators/current-user.decorator';
import { AccessStatus } from '@prisma/client';

@Controller('access-logs')
export class AccessLogsController {
  constructor(private service: AccessLogsService) {}

  @Get()
  findAll(
    @TenantContext() ctx: any,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('search') search?: string,
    @Query('status') status?: AccessStatus,
    @Query('personType') personType?: string,
    @Query('unitId') unitId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.service.findAll(ctx, +page, +limit, {
      search, status, personType, unitId, dateFrom, dateTo,
    });
  }

  @Get('inside')
  findInsideNow(@TenantContext() ctx: any) {
    return this.service.findInsideNow(ctx);
  }

  @Get('dashboard')
  getDashboard(@TenantContext() ctx: any) {
    return this.service.getDashboardSummary(ctx);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @TenantContext() ctx: any) {
    return this.service.findOne(id, ctx);
  }

  @Post()
  create(@Body() dto: CreateAccessLogDto, @TenantContext() ctx: any) {
    return this.service.create(dto, ctx);
  }

  @Post('entry')
  registerEntry(@Body() dto: RegisterEntryDto, @TenantContext() ctx: any) {
    return this.service.registerEntry(dto, ctx);
  }

  @Patch(':id/exit')
  registerExit(@Param('id') id: string, @TenantContext() ctx: any) {
    return this.service.registerExit(id, ctx);
  }

  @Patch(':id/authorize')
  authorize(@Param('id') id: string, @TenantContext() ctx: any) {
    return this.service.authorize(id, ctx);
  }

  @Patch(':id/deny')
  deny(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @TenantContext() ctx: any,
  ) {
    return this.service.deny(id, reason, ctx);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateAccessStatusDto,
    @TenantContext() ctx: any,
  ) {
    return this.service.updateStatus(id, dto, ctx);
  }
}
