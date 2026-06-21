import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'E-mail inválido' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Senha obrigatória' })
  password: string;
}

export class RefreshTokenDto {
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @IsString()
  @MinLength(8, { message: 'Senha deve ter pelo menos 8 caracteres' })
  newPassword: string;
}

export class ForgotPasswordDto {
  @IsEmail({}, { message: 'E-mail inválido' })
  email: string;
}

export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @MinLength(8, { message: 'Senha deve ter pelo menos 8 caracteres' })
  newPassword: string;
}

export class SelectCondominiumDto {
  @IsString()
  @IsNotEmpty()
  condominiumId: string;
}
