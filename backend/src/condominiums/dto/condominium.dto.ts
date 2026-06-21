import {
  IsBoolean, IsOptional, IsString,
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

export class CreateCondominiumDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  cnpj?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  state?: string;

  @IsString()
  @IsOptional()
  zipCode?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  syndicName?: string;

  @IsString()
  @IsOptional()
  syndicPhone?: string;

  @IsString()
  @IsOptional()
  logoUrl?: string;
}

export class UpdateCondominiumDto extends PartialType(CreateCondominiumDto) {
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
