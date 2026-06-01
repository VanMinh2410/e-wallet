import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';
import { WalletsService } from './wallets.service';
import { TransferDto } from './dto/transfer.dto';

@ApiTags('wallets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('wallets')
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) {}

  @Get()
  async getMyWallet(@CurrentUser() user: AuthUser) {
    const wallet = await this.walletsService.getWalletByUserId(user.userId);
    return {
      id: wallet._id,
      balance: wallet.balance,
      currency: wallet.currency,
    };
  }

  @Get(':id/balance')
  async getBalance(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    const wallet = await this.walletsService.getWalletByUserId(user.userId);
    if (wallet._id.toString() !== id) {
      return this.walletsService.getBalance(user.userId);
    }
    return this.walletsService.getBalance(user.userId);
  }

  @Post('resolve-recipient')
  resolveRecipient(@Body() body: { recipient: string }) {
    return this.walletsService.resolveWalletRecipient(body.recipient);
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post(':id/transfers')
  transfer(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: TransferDto,
    @Headers('x-idempotency-key') idempotencyKey?: string,
  ) {
    return this.walletsService.transfer(user.userId, id, dto, idempotencyKey);
  }
}
