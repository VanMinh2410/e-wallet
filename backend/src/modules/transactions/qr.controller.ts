import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';
import { TransactionsService } from './transactions.service';

@ApiTags('qr')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('qr')
export class QrController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get('generate')
  generate(@CurrentUser() user: AuthUser, @Query('amount') amount?: number) {
    return this.transactionsService.generateQr(user.userId, amount ? Number(amount) : undefined);
  }
}
