import {
  Body, Controller, Delete, Get, Param, Patch, Post, Query,
} from '@nestjs/common';
import { OccurrencesService } from './occurrences.service';
import { AddCommentDto, CreateOccurrenceDto, UpdateOccurrenceDto } from './dto/occurrence.dto';
import { TenantContext } from '../common/decorators/current-user.decorator';
import { OccurrenceStatus } from '@prisma/client';

@Controller('occurrences')
export class OccurrencesController {
  constructor(private service: OccurrencesService) {}

  @Get()
  findAll(
    @TenantContext() ctx: any,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('status') status?: OccurrenceStatus,
    @Query('search') search?: string,
  ) {
    return this.service.findAll(ctx, +page, +limit, status, search);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @TenantContext() ctx: any) {
    return this.service.findOne(id, ctx);
  }

  @Post()
  create(@Body() dto: CreateOccurrenceDto, @TenantContext() ctx: any) {
    return this.service.create(dto, ctx);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateOccurrenceDto,
    @TenantContext() ctx: any,
  ) {
    return this.service.update(id, dto, ctx);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @TenantContext() ctx: any) {
    return this.service.remove(id, ctx);
  }

  @Post(':id/comments')
  addComment(
    @Param('id') id: string,
    @Body() dto: AddCommentDto,
    @TenantContext() ctx: any,
  ) {
    return this.service.addComment(id, dto, ctx);
  }
}
