import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuditLog, AuditLogSchema } from '../../common/schemas/audit-log.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Wallet, WalletSchema } from '../wallets/schemas/wallet.schema';
import { Transaction, TransactionSchema } from './schemas/transaction.schema';
import { AuthModule } from '../auth/auth.module';
import { BankModule } from '../bank/bank.module';
import { TransactionsController } from './transactions.controller';
import { QrController } from './qr.controller';
import { TransactionsService } from './transactions.service';

@Module({
  imports: [
    AuthModule,
    BankModule,
    MongooseModule.forFeature([
      { name: Transaction.name, schema: TransactionSchema },
      { name: Wallet.name, schema: WalletSchema },
      { name: User.name, schema: UserSchema },
      { name: AuditLog.name, schema: AuditLogSchema },
    ]),
  ],
  controllers: [TransactionsController, QrController],
  providers: [TransactionsService],
  exports: [TransactionsService],
})
export class TransactionsModule {}
