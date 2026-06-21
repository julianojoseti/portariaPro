import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { AccessStatus, PersonType } from '@prisma/client';

export class CreateAccessLogDto {
  @IsEnum(PersonType)
  personType: PersonType;

  @IsString()
  personName: string;

  @IsString()
  @IsOptional()
  personDocument?: string;

  @IsString()
  @IsOptional()
  vehiclePlate?: string;

  @IsString()
  @IsOptional()
  purpose?: string;

  @IsString()
  @IsOptional()
  photoUrl?: string;

  @IsUUID()
  @IsOptional()
  unitId?: string;

  @IsUUID()
  @IsOptional()
  visitorId?: string;

  @IsUUID()
  @IsOptional()
  serviceProviderId?: string;

  @IsUUID()
  @IsOptional()
  residentId?: string;

  @IsString()
  @IsOptional()
  observations?: string;
}

export class UpdateAccessStatusDto {
  @IsEnum(AccessStatus)
  status: AccessStatus;

  @IsDateString()
  @IsOptional()
  entryAt?: string;

  @IsDateString()
  @IsOptional()
  exitAt?: string;

  @IsString()
  @IsOptional()
  deniedReason?: string;

  @IsString()
  @IsOptional()
  observations?: string;
}

export class RegisterEntryDto {
  @IsUUID()
  @IsOptional()
  visitorId?: string;

  @IsUUID()
  @IsOptional()
  serviceProviderId?: string;

  @IsEnum(PersonType)
  personType: PersonType;

  @IsString()
  personName: string;

  @IsString()
  @IsOptional()
  personDocument?: string;

  @IsString()
  @IsOptional()
  vehiclePlate?: string;

  @IsString()
  @IsOptional()
  purpose?: string;

  @IsUUID()
  @IsOptional()
  unitId?: string;
}
