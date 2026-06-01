import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsMongoId, IsNumber, IsOptional, IsString, Length, Min, ValidateIf } from 'class-validator';

export class BankTransferDto {
  @ApiPropertyOptional({ description: 'Tài khoản đã liên kết' })
  @IsOptional()
  @IsMongoId()
  bankAccountId?: string;

  @ApiPropertyOptional()
  @ValidateIf((o) => !o.bankAccountId)
  @IsString()
  bankCode?: string;

  @ApiPropertyOptional()
  @ValidateIf((o) => !o.bankAccountId)
  @IsString()
  bankName?: string;

  @ApiPropertyOptional()
  @ValidateIf((o) => !o.bankAccountId)
  @IsString()
  @Length(6, 20)
  accountNumber?: string;

  @ApiPropertyOptional()
  @ValidateIf((o) => !o.bankAccountId)
  @IsString()
  accountName?: string;

  @ApiProperty()
  @IsNumber()
  @Min(10000)
  amount: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'OTP giao dịch (bắt buộc nếu >= 5 triệu)' })
  @IsOptional()
  @IsString()
  @Length(6, 6)
  otpCode?: string;
}
