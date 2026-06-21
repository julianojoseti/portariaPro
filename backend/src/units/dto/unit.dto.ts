import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

export class CreateUnitDto {
  @IsString()
  @IsOptional()
  block?: string;

  @IsString()
  number: string;

  @IsString()
  @IsOptional()
  type?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  floor?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  parkingSpots?: number;

  @IsString()
  @IsOptional()
  observations?: string;
}

export class UpdateUnitDto extends PartialType(CreateUnitDto) {}
