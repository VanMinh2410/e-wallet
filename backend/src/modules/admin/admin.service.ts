import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';
import {
  Transaction,
  TransactionDocument,
  TransactionStatus,
  TransactionType,
} from '../transactions/schemas/transaction.schema';
import { TransactionsService } from '../transactions/transactions.service';
import { BankService } from '../bank/bank.service';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Transaction.name) private transactionModel: Model<TransactionDocument>,
    private transactionsService: TransactionsService,
    private bankService: BankService,
  ) {}

  listBankAccounts(page = 1, limit = 20) {
    return this.bankService.listAllAccounts(page, limit);
  }

  verifyBankAccount(accountId: string, isVerified: boolean) {
    return this.bankService.adminVerifyAccount(accountId, isVerified);
  }

  deleteBankAccount(accountId: string) {
    return this.bankService.adminDeleteAccount(accountId);
  }

  async listUsers(page = 1, limit = 20, search?: string) {
    const skip = (page - 1) * limit;
    const filter: Record<string, unknown> = {};
    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }
    const [items, total] = await Promise.all([
      this.userModel.find(filter).select('-passwordHash').skip(skip).limit(limit).lean(),
      this.userModel.countDocuments(filter),
    ]);
    return { items, total, page, limit };
  }

  async banUser(userId: string) {
    await this.userModel.findByIdAndUpdate(userId, { isActive: false });
    return { message: 'Đã khóa tài khoản' };
  }

  async unbanUser(userId: string) {
    await this.userModel.findByIdAndUpdate(userId, { isActive: true });
    return { message: 'Đã mở khóa tài khoản' };
  }

  async pendingApprovals() {
    return this.transactionModel
      .find({ type: TransactionType.WITHDRAW, status: TransactionStatus.PENDING })
      .sort({ createdAt: -1 })
      .lean();
  }

  async approveTransaction(transactionId: string, approve: boolean, adminId: string) {
    return this.transactionsService.approveWithdraw(transactionId, approve, adminId);
  }

  async getAllTransactions(page = 1, limit = 20, type?: string, status?: string) {
    const skip = (page - 1) * limit;
    const filter: Record<string, unknown> = {};
    if (type) filter.type = type;
    if (status) filter.status = status;
    const [items, total] = await Promise.all([
      this.transactionModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      this.transactionModel.countDocuments(filter),
    ]);
    return { items, total, page, limit };
  }

  async analytics() {
    const [userCount, txCount, pendingWithdraw, totalDepositAgg, totalWithdrawAgg] =
      await Promise.all([
        this.userModel.countDocuments({ isActive: true }),
        this.transactionModel.countDocuments({ status: TransactionStatus.SUCCESS }),
        this.transactionModel.countDocuments({
          type: TransactionType.WITHDRAW,
          status: TransactionStatus.PENDING,
        }),
        this.transactionModel.aggregate([
          { $match: { type: TransactionType.DEPOSIT, status: TransactionStatus.SUCCESS } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]),
        this.transactionModel.aggregate([
          { $match: { type: TransactionType.WITHDRAW, status: TransactionStatus.SUCCESS } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]),
      ]);
    return {
      userCount,
      txCount,
      pendingWithdraw,
      totalDeposit: (totalDepositAgg as Array<{ total: number }>)[0]?.total ?? 0,
      totalWithdraw: (totalWithdrawAgg as Array<{ total: number }>)[0]?.total ?? 0,
    };
  }
}
