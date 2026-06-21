import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  COMPANY_ADMIN = 'COMPANY_ADMIN',
  MANAGER = 'MANAGER',
  DOORMAN = 'DOORMAN',
  RESIDENT = 'RESIDENT',
  EMPLOYEE = 'EMPLOYEE',
}

export class CreateUserDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsUUID()
  roleId: string;

  @IsUUID()
  @IsOptional()
  condominiumId?: string;
}

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  photoUrl?: string;

  @IsUUID()
  @IsOptional()
  roleId?: string;
}

export class AssignCondominiumDto {
  @IsUUID()
  condominiumId: string;
}
