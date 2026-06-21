import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import {
  AssignCondominiumDto,
  CreateUserDto,
  UpdateUserDto,
} from './dto/user.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { TenantContext } from '../common/decorators/current-user.decorator';

@Controller('users')
@UseGuards(RolesGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @Roles('SUPER_ADMIN', 'COMPANY_ADMIN', 'MANAGER')
  findAll(
    @TenantContext() ctx: any,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('search') search?: string,
  ) {
    return this.usersService.findAll(ctx, +page, +limit, search);
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'COMPANY_ADMIN', 'MANAGER')
  findOne(@Param('id') id: string, @TenantContext() ctx: any) {
    return this.usersService.findOne(id, ctx);
  }

  @Post()
  @Roles('SUPER_ADMIN', 'COMPANY_ADMIN')
  create(@Body() dto: CreateUserDto, @TenantContext() ctx: any) {
    return this.usersService.create(dto, ctx);
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN', 'COMPANY_ADMIN', 'MANAGER')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @TenantContext() ctx: any,
  ) {
    return this.usersService.update(id, dto, ctx);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN', 'COMPANY_ADMIN')
  remove(@Param('id') id: string, @TenantContext() ctx: any) {
    return this.usersService.remove(id, ctx);
  }

  @Post(':id/condominiums')
  @Roles('SUPER_ADMIN', 'COMPANY_ADMIN')
  assignCondominium(
    @Param('id') id: string,
    @Body() dto: AssignCondominiumDto,
    @TenantContext() ctx: any,
  ) {
    return this.usersService.assignCondominium(id, dto, ctx);
  }

  @Delete(':id/condominiums/:condominiumId')
  @Roles('SUPER_ADMIN', 'COMPANY_ADMIN')
  removeCondominium(
    @Param('id') id: string,
    @Param('condominiumId') condominiumId: string,
    @TenantContext() ctx: any,
  ) {
    return this.usersService.removeCondominium(id, condominiumId, ctx);
  }
}
