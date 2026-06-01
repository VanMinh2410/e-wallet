import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class TransferDto {
  @ApiProperty({ description: 'Email hoặc số điện thoại người nhận' })
  @IsString()
  recipient: string;

  @ApiProperty({ minimum: 1000, maximum: 100000000 })
  @IsInt()
  @Min(1000)
  @Max(100000000)
  amount: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;

  @ApiPropertyOptional({ description: 'OTP giao dịch (>= 5 triệu)' })
  @IsOptional()
  @IsString()
  otpCode?: string;
}
