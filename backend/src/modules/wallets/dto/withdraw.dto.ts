import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class WithdrawDto {
  @ApiProperty({ minimum: 10000, maximum: 50000000 })
  @IsInt()
  @Min(10000)
  @Max(50000000)
  amount: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bankAccountId?: string;

  @ApiPropertyOptional({ description: 'OTP code for transaction verification' })
  @IsOptional()
  @IsString()
  otpCode?: string;
}
