import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Transaction, TransactionSchema } from '../transactions/schemas/transaction.schema';
import { TransactionsModule } from '../transactions/transactions.module';
import { BankModule } from '../bank/bank.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Transaction.name, schema: TransactionSchema },
    ]),
    TransactionsModule,
    BankModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
