import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { ResidentType } from '@prisma/client';

export class CreateResidentDto {
  @IsUUID()
  unitId: string;

  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  document?: string;

  @IsString()
  @IsOptional()
  rg?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  phone2?: string;

  @IsString()
  @IsOptional()
  photoUrl?: string;

  @IsEnum(ResidentType)
  @IsOptional()
  type?: ResidentType;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsBoolean()
  @IsOptional()
  canAuthorizeVisitors?: boolean;

  @IsString()
  @IsOptional()
  observations?: string;
}

export class UpdateResidentDto extends PartialType(CreateResidentDto) {}
