import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { PackageStatus } from '@prisma/client';

export class CreatePackageDto {
  @IsUUID()
  unitId: string;

  @IsString()
  recipientName: string;

  @IsString()
  @IsOptional()
  carrier?: string;

  @IsString()
  @IsOptional()
  trackingCode?: string;

  @IsString()
  @IsOptional()
  packageType?: string;

  @IsString()
  @IsOptional()
  photoUrl?: string;

  @IsString()
  @IsOptional()
  observations?: string;
}

export class RetrievePackageDto {
  @IsString()
  retrievedByName: string;

  @IsString()
  @IsOptional()
  retrievedById?: string;
}
