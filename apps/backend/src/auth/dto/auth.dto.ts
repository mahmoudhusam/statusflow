import { IsEmail, IsNotEmpty, Length, Matches } from 'class-validator';

export class AuthDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  @Length(8, 20)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,20}$/, {
    message:
      'Password must be 6-20 characters long, include at least one uppercase letter, one lowercase letter, and one number.',
  })
  password: string;
}
