import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BankAccount, BankAccountSchema } from './schemas/bank-account.schema';
import { BankController, BanksCatalogController } from './bank.controller';
import { BankService } from './bank.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: BankAccount.name, schema: BankAccountSchema }])],
  controllers: [BankController, BanksCatalogController],
  providers: [BankService],
  exports: [BankService],
})
export class BankModule {}
