import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  fullName: string;

  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty({ example: '0912345678' })
  @Matches(/^(0|\+84)[3-9]\d{8}$/, { message: 'Số điện thoại không hợp lệ' })
  phone: string;

  @ApiProperty()
  @IsString()
  @MinLength(8)
  @Matches(/(?=.*[A-Z])(?=.*\d)/, {
    message: 'Mật khẩu phải có ít nhất 1 chữ hoa và 1 số',
  })
  password: string;
}
