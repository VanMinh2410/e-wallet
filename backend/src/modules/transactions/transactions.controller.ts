import { Body, Controller, Get, Headers, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';
import { TransactionsService } from './transactions.service';
import { TopupDto } from '../wallets/dto/topup.dto';
import { WithdrawDto } from '../wallets/dto/withdraw.dto';
import { BankTransferDto } from './dto/bank-transfer.dto';
import { BusinessException } from '../../common/exceptions/business.exception';

@ApiTags('transactions')
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get()
  history(
    @CurrentUser() user: AuthUser,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('type') type?: string,
    @Query('status') status?: string,
  ) {
    return this.transactionsService.getHistory(user.userId, Number(page), Math.min(Number(limit), 100), type, status);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  getOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.transactionsService.getById(user.userId, id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('deposit')
  deposit(@CurrentUser() user: AuthUser, @Body() dto: TopupDto) {
    return this.transactionsService.createTopup(user.userId, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('withdraw')
  withdraw(@CurrentUser() user: AuthUser, @Body() dto: WithdrawDto) {
    return this.transactionsService.createWithdraw(user.userId, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('bank-transfer')
  bankTransfer(@CurrentUser() user: AuthUser, @Body() dto: BankTransferDto) {
    return this.transactionsService.createBankTransfer(user.userId, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('qr-payment')
  qrPayment(
    @CurrentUser() user: AuthUser,
    @Body('walletId') walletId: string,
    @Body('qrData') qrData: string,
    @Body('amount') amount?: number,
    @Body('otpCode') otpCode?: string,
  ) {
    return this.transactionsService.qrPayment(user.userId, walletId, qrData, amount, otpCode);
  }

  @Post('webhooks/payment')
  webhook(
    @Body('reference') reference: string,
    @Body('amount') amount: number,
    @Headers('x-webhook-signature') signature?: string,
  ) {
    return this.transactionsService.processTopupWebhook(reference, amount, signature);
  }

  @Post('vnpay/verify')
  verifyVnpay(@Body() body: Record<string, string>) {
    return this.transactionsService.verifyVnpayPayment(body);
  }

  @Get('vnpay/ipn')
  async ipn(@Query() query: Record<string, string>) {
    try {
      const result = await this.transactionsService.verifyVnpayPayment(query);
      if (result.message === 'Giao dịch đã được xử lý trước đó') {
        return { RspCode: '02', Message: 'Order already confirmed' };
      }
      if (result.isVerified) {
        return { RspCode: '00', Message: 'Confirm success' };
      } else {
        return { RspCode: '00', Message: result.message || 'Confirm success' };
      }
    } catch (error) {
      if (error instanceof BusinessException) {
        if (error.message.includes('Chữ ký VNPay không hợp lệ')) {
          return { RspCode: '97', Message: 'Invalid signature' };
        }
        if (error.message.includes('Giao dịch không tồn tại')) {
          return { RspCode: '01', Message: 'Order not found' };
        }
      }
      return { RspCode: '99', Message: error.message || 'Unknown error' };
    }
  }
}
