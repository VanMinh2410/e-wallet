import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';
import { BankService } from './bank.service';
import { BANK_CATALOG } from './banks.catalog';

@ApiTags('banks')
@Controller('banks')
export class BanksCatalogController {
  @Get('catalog')
  getCatalog() {
    return BANK_CATALOG;
  }
}

@ApiTags('bank-accounts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('bank-accounts')
export class BankController {
  constructor(private readonly bankService: BankService) {}

  @Post()
  add(@CurrentUser() user: AuthUser, @Body() body: { bankCode: string; bankName: string; accountNumber: string; accountName: string }) {
    return this.bankService.addAccount(user.userId, body);
  }

  @Post('resolve-recipient')
  resolveRecipient(@Body() body: { bankCode: string; accountNumber: string }) {
    return this.bankService.resolveRecipient(body);
  }

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.bankService.list(user.userId);
  }

  @Post(':id/verify')
  verify(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.bankService.verify(user.userId, id);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.bankService.remove(user.userId, id);
  }
}
