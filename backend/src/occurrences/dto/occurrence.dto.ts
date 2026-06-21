import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { OccurrencePriority, OccurrenceStatus } from '@prisma/client';

export class CreateOccurrenceDto {
  @IsString()
  type: string;

  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsEnum(OccurrencePriority)
  @IsOptional()
  priority?: OccurrencePriority;

  @IsUUID()
  @IsOptional()
  unitId?: string;

  @IsString()
  @IsOptional()
  involvedPeople?: string;

  @IsString()
  @IsOptional()
  observations?: string;
}

export class UpdateOccurrenceDto {
  @IsEnum(OccurrenceStatus)
  @IsOptional()
  status?: OccurrenceStatus;

  @IsString()
  @IsOptional()
  resolutionNote?: string;

  @IsUUID()
  @IsOptional()
  assignedToId?: string;
}

export class AddCommentDto {
  @IsString()
  content: string;
}
