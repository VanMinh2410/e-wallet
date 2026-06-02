import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model, Types } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Wallet, WalletDocument } from '../wallets/schemas/wallet.schema';
import { AuditLog, AuditLogDocument } from '../../common/schemas/audit-log.schema';
import { NotificationGateway } from '../../gateways/notification.gateway';
import { NotificationsService } from '../notifications/notifications.service';
import { BusinessException } from '../../common/exceptions/business.exception';
import { ErrorCodes } from '../../common/constants/error-codes';
import {
  Transaction,
  TransactionDocument,
  TransactionStatus,
  TransactionType,
} from '../transactions/schemas/transaction.schema';
import { TransactionsService } from '../transactions/transactions.service';
import { BankService } from '../bank/bank.service';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Transaction.name) private transactionModel: Model<TransactionDocument>,
    @InjectModel(Wallet.name) private walletModel: Model<WalletDocument>,
    @InjectModel(AuditLog.name) private auditModel: Model<AuditLogDocument>,
    @InjectConnection() private connection: Connection,
    private transactionsService: TransactionsService,
    private bankService: BankService,
    private notificationGateway: NotificationGateway,
    private notificationsService: NotificationsService,
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
    const txs = await this.transactionModel
      .find({ type: TransactionType.WITHDRAW, status: TransactionStatus.PENDING })
      .populate({ path: 'userId', select: 'fullName email phone' })
      .sort({ createdAt: -1 })
      .lean();

    const result = [];
    for (const tx of txs) {
      const bankAccountId = tx.metadata?.bankAccountId as any;
      let bankInfo = null;
      if (bankAccountId && Types.ObjectId.isValid(bankAccountId)) {
        bankInfo = await this.bankService.getAccountById(bankAccountId);
      }
      if (!bankInfo && tx.userId) {
        const userIdStr = (tx.userId as any)._id?.toString() || tx.userId.toString();
        if (Types.ObjectId.isValid(userIdStr)) {
          const accounts = await this.bankService.list(userIdStr);
          if (accounts && accounts.length > 0) {
            bankInfo = accounts[0];
          }
        }
      }
      result.push({
        ...tx,
        bankInfo,
      });
    }
    return result;
  }

  async approveTransaction(transactionId: string, approve: boolean, adminId: string) {
    return this.transactionsService.approveWithdraw(transactionId, approve, adminId);
  }

  async getAllTransactions(page = 1, limit = 20, type?: string, status?: string) {
    const skip = (page - 1) * limit;
    const filter: Record<string, unknown> = {};
    if (type) {
      filter.type = type;
    } else {
      filter.type = { $ne: TransactionType.RECEIVE };
    }
    if (status) filter.status = status;
    const [items, total] = await Promise.all([
      this.transactionModel.find(filter)
        .populate({ path: 'userId', select: 'fullName email phone' })
        .populate({
          path: 'fromWalletId',
          populate: { path: 'userId', select: 'fullName email phone' }
        })
        .populate({
          path: 'toWalletId',
          populate: { path: 'userId', select: 'fullName email phone' }
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.transactionModel.countDocuments(filter),
    ]);
    return { items, total, page, limit };
  }

  async analytics() {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [userCount, txCount, pendingWithdraw, totalDepositAgg, totalWithdrawAgg, dailyRevenueAgg, hourlyTxsAgg] =
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
        this.transactionModel.aggregate([
          {
            $match: {
              status: TransactionStatus.SUCCESS,
              createdAt: { $gte: sevenDaysAgo },
              type: { $in: [TransactionType.DEPOSIT, TransactionType.WITHDRAW] },
            },
          },
          {
            $group: {
              _id: {
                date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                type: '$type',
              },
              total: { $sum: '$amount' },
            },
          },
          { $sort: { '_id.date': 1 } },
        ]),
        this.transactionModel.aggregate([
          {
            $match: {
              createdAt: { $gte: startOfToday },
            },
          },
          {
            $group: {
              _id: { $hour: '$createdAt' },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ]),
      ]);

    // Format daily data:
    const chartDataMap: Record<string, { date: string; deposit: number; withdraw: number }> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      chartDataMap[dateStr] = { date: dateStr, deposit: 0, withdraw: 0 };
    }

    for (const item of dailyRevenueAgg) {
      const date = item._id.date;
      const type = item._id.type;
      const total = item.total || 0;
      if (chartDataMap[date]) {
        if (type === TransactionType.DEPOSIT) {
          chartDataMap[date].deposit = total;
        } else if (type === TransactionType.WITHDRAW) {
          chartDataMap[date].withdraw = total;
        }
      }
    }
    const dailyRevenue = Object.values(chartDataMap);

    const hourlyTransactions = Array.from({ length: 24 }, (_, i) => ({ hour: `${String(i).padStart(2, '0')}h`, val: 0 }));
    for (const item of hourlyTxsAgg) {
      const hr = item._id; // 0 to 23
      if (hr >= 0 && hr < 24) {
        hourlyTransactions[hr].val = item.count || 0;
      }
    }

    return {
      userCount,
      txCount,
      pendingWithdraw,
      totalDeposit: (totalDepositAgg as Array<{ total: number }>)[0]?.total ?? 0,
      totalWithdraw: (totalWithdrawAgg as Array<{ total: number }>)[0]?.total ?? 0,
      dailyRevenue,
      hourlyTransactions,
    };
  }

  async updateKycStatus(userId: string, kycStatus: string, adminId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new BusinessException('Người dùng không tồn tại', ErrorCodes.NOT_FOUND, HttpStatus.NOT_FOUND);

    const oldStatus = user.kycStatus;
    user.kycStatus = kycStatus;
    await user.save();

    await this.auditModel.create({
      userId: new Types.ObjectId(adminId),
      action: 'KYC_STATUS_UPDATE',
      resource: 'users',
      metadata: { targetUserId: userId, oldStatus, newStatus: kycStatus },
      ip: '127.0.0.1',
    });

    return { message: `Cập nhật trạng thái KYC thành công: ${kycStatus}` };
  }

  async updateRole(userId: string, role: string, adminId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new BusinessException('Người dùng không tồn tại', ErrorCodes.NOT_FOUND, HttpStatus.NOT_FOUND);

    const oldRole = user.role;
    user.role = role;
    await user.save();

    await this.auditModel.create({
      userId: new Types.ObjectId(adminId),
      action: 'ROLE_UPDATE',
      resource: 'users',
      metadata: { targetUserId: userId, oldRole, newRole: role },
      ip: '127.0.0.1',
    });

    return { message: `Cập nhật quyền hạn thành công thành: ${role}` };
  }

  async resetPassword(userId: string, adminId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new BusinessException('Người dùng không tồn tại', ErrorCodes.NOT_FOUND, HttpStatus.NOT_FOUND);

    const defaultPassword = 'User@123456';
    user.passwordHash = await bcrypt.hash(defaultPassword, 12);
    await user.save();

    await this.auditModel.create({
      userId: new Types.ObjectId(adminId),
      action: 'PASSWORD_RESET_ADMIN',
      resource: 'users',
      metadata: { targetUserId: userId },
      ip: '127.0.0.1',
    });

    return { message: 'Đã đặt lại mật khẩu của người dùng về mặc định: User@123456' };
  }

  async updateLimit(userId: string, limit: number, adminId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new BusinessException('Người dùng không tồn tại', ErrorCodes.NOT_FOUND, HttpStatus.NOT_FOUND);

    const oldLimit = user.transferLimit;
    user.transferLimit = limit;
    await user.save();

    await this.auditModel.create({
      userId: new Types.ObjectId(adminId),
      action: 'TRANSFER_LIMIT_UPDATE',
      resource: 'users',
      metadata: { targetUserId: userId, oldLimit, newLimit: limit },
      ip: '127.0.0.1',
    });

    return { message: `Cập nhật hạn mức chuyển khoản thành công: ${limit.toLocaleString('vi-VN')}đ` };
  }

  async getLoginLogs(userId: string) {
    return this.auditModel
      .find({ userId: new Types.ObjectId(userId), action: 'LOGIN_SUCCESS' })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
  }

  async refundTransaction(transactionId: string, adminId: string) {
    const tx = await this.transactionModel.findById(transactionId);
    if (!tx) {
      throw new BusinessException('Giao dịch không tồn tại', ErrorCodes.TRANSACTION_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    if (tx.status !== TransactionStatus.SUCCESS) {
      throw new BusinessException('Chỉ có thể hoàn tiền giao dịch thành công', ErrorCodes.VALIDATION_ERROR, HttpStatus.BAD_REQUEST);
    }

    if (![TransactionType.TRANSFER, TransactionType.RECEIVE, TransactionType.BANK_TRANSFER, TransactionType.PAYMENT].includes(tx.type)) {
      throw new BusinessException('Loại giao dịch này không hỗ trợ hoàn tiền', ErrorCodes.VALIDATION_ERROR, HttpStatus.BAD_REQUEST);
    }

    if (tx.metadata?.refunded) {
      throw new BusinessException('Giao dịch này đã được hoàn tiền trước đó', ErrorCodes.VALIDATION_ERROR, HttpStatus.BAD_REQUEST);
    }

    // Find the pair transaction (the matching credit/debit transaction).
    const timeLimit = 60 * 1000; // 1 minute window
    const txCreatedAt = (tx as any).createdAt as Date;
    const pairTx = await this.transactionModel.findOne({
      fromWalletId: tx.fromWalletId,
      toWalletId: tx.toWalletId,
      amount: tx.amount,
      _id: { $ne: tx._id },
      createdAt: {
        $gte: new Date(txCreatedAt.getTime() - timeLimit),
        $lte: new Date(txCreatedAt.getTime() + timeLimit),
      },
    });

    if (pairTx && pairTx.metadata?.refunded) {
      throw new BusinessException('Giao dịch này đã được hoàn tiền trước đó', ErrorCodes.VALIDATION_ERROR, HttpStatus.BAD_REQUEST);
    }

    const senderWallet = await this.walletModel.findById(tx.fromWalletId);
    const recipientWallet = await this.walletModel.findById(tx.toWalletId);

    if (!senderWallet || !recipientWallet) {
      throw new BusinessException('Không tìm thấy ví tương ứng của giao dịch', ErrorCodes.WALLET_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    // Check if recipient wallet has enough balance to refund
    if (recipientWallet.balance < tx.amount) {
      throw new BusinessException(
        `Số dư ví nhận không đủ để hoàn tiền. Số dư hiện tại: ${recipientWallet.balance.toLocaleString('vi-VN')}đ, cần hoàn: ${tx.amount.toLocaleString('vi-VN')}đ`,
        ErrorCodes.INSUFFICIENT_BALANCE,
        HttpStatus.BAD_REQUEST,
      );
    }

    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      // Deduct from recipient, add to sender
      await this.walletModel.findByIdAndUpdate(recipientWallet._id, { $inc: { balance: -tx.amount } }, { session });
      await this.walletModel.findByIdAndUpdate(senderWallet._id, { $inc: { balance: tx.amount } }, { session });

      // Mark original transaction(s) as refunded
      tx.metadata = { ...tx.metadata, refunded: true, refundedAt: new Date(), refundedBy: adminId };
      await tx.save({ session });
      if (pairTx) {
        pairTx.metadata = { ...pairTx.metadata, refunded: true, refundedAt: new Date(), refundedBy: adminId };
        await pairTx.save({ session });
      }

      // Create refund transactions in history
      const refundRefOut = `RFD-${uuidv4()}`;
      const refundRefIn = `RFR-${uuidv4()}`;

      await this.transactionModel.create(
        [
          {
            reference: refundRefOut,
            type: TransactionType.REFUND,
            status: TransactionStatus.SUCCESS,
            userId: senderWallet.userId,
            fromWalletId: recipientWallet._id,
            toWalletId: senderWallet._id,
            amount: tx.amount,
            description: `Hoàn tiền giao dịch ${tx.reference} (Tra soát từ Admin)`,
            metadata: { originalReference: tx.reference, originalTransactionId: tx._id.toString() },
          },
          {
            reference: refundRefIn,
            type: TransactionType.REFUND,
            status: TransactionStatus.SUCCESS,
            userId: recipientWallet.userId,
            fromWalletId: recipientWallet._id,
            toWalletId: senderWallet._id,
            amount: tx.amount,
            description: `Thu hồi tiền giao dịch ${tx.reference} (Hoàn trả từ Admin)`,
            metadata: { originalReference: tx.reference, originalTransactionId: tx._id.toString() },
          },
        ],
        { session, ordered: true },
      );

      await session.commitTransaction();

      const senderUpdated = await this.walletModel.findById(senderWallet._id);
      const recipientUpdated = await this.walletModel.findById(recipientWallet._id);

      this.notificationGateway.emitBalanceUpdated(senderWallet.userId.toString(), senderUpdated?.balance ?? 0);
      this.notificationGateway.emitBalanceUpdated(recipientWallet.userId.toString(), recipientUpdated?.balance ?? 0);

      await this.notificationsService.create(
        senderWallet.userId.toString(),
        'Hoàn tiền giao dịch',
        `Bạn đã được hoàn trả +${tx.amount.toLocaleString('vi-VN')}đ cho giao dịch ${tx.reference} do tra soát từ hệ thống.`,
        'transfer',
      );
      await this.notificationsService.create(
        recipientWallet.userId.toString(),
        'Thu hồi tiền giao dịch',
        `Tài khoản của bạn đã bị thu hồi -${tx.amount.toLocaleString('vi-VN')}đ cho giao dịch ${tx.reference} do tra soát từ hệ thống.`,
        'transfer',
      );

      // Audit log the refund action
      await this.auditModel.create({
        userId: new Types.ObjectId(adminId),
        action: 'TRANSACTION_REFUND',
        resource: 'transaction',
        metadata: { targetTransactionId: transactionId, originalReference: tx.reference, amount: tx.amount },
        ip: '127.0.0.1',
      });

      return { message: 'Hoàn tiền và thu hồi tiền giao dịch thành công' };
    } catch (e) {
      await session.abortTransaction();
      throw e;
    } finally {
      session.endSession();
    }
  }
}
