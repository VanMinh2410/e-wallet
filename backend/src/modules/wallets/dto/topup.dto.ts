import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class TopupDto {
  @ApiProperty({ minimum: 10000, maximum: 50000000 })
  @IsInt()
  @Min(10000)
  @Max(50000000)
  amount: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  paymentMethod?: string;
}
