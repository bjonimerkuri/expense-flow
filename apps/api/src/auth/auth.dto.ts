import { Transform } from 'class-transformer';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class CredentialsDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail()
  @MaxLength(254)
  email: string;

  // bcrypt only uses the first 72 bytes, so longer passwords add no security.
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password: string;
}
