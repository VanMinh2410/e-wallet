import { HttpStatus, Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model, Types } from 'mongoose';
import { createHmac } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { ConfigService } from '@nestjs/config';
import { BusinessException } from '../../common/exceptions/business.exception';
import { ErrorCodes } from '../../common/constants/error-codes';
import { RedisService } from '../../common/redis/redis.service';
import { Wallet, WalletDocument } from '../wallets/schemas/wallet.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import {
  Transaction,
  TransactionDocument,
  TransactionStatus,
  TransactionType,
} from './schemas/transaction.schema';
import { TopupDto } from '../wallets/dto/topup.dto';
import { WithdrawDto } from '../wallets/dto/withdraw.dto';
import { BankTransferDto } from './dto/bank-transfer.dto';
import { NotificationGateway } from '../../gateways/notification.gateway';
import { NotificationsService } from '../notifications/notifications.service';
import { AuditLog, AuditLogDocument } from '../../common/schemas/audit-log.schema';
import { BankService } from '../bank/bank.service';
import { AuthService } from '../auth/auth.service';
import { MailerService } from '../../common/mailer/mailer.service';
import { VNPay, HashAlgorithm } from 'vnpay';

@Injectable()
export class TransactionsService implements OnModuleInit, OnModuleDestroy {
  constructor(
    @InjectModel(Transaction.name) private transactionModel: Model<TransactionDocument>,
    @InjectModel(Wallet.name) private walletModel: Model<WalletDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(AuditLog.name) private auditModel: Model<AuditLogDocument>,
    @InjectConnection() private connection: Connection,
    private redisService: RedisService,
    private notificationGateway: NotificationGateway,
    private notificationsService: NotificationsService,
    private bankService: BankService,
    private authService: AuthService,
    private mailerService: MailerService,
    private configService: ConfigService,
  ) {}

  private cleanupInterval: NodeJS.Timeout;

  onModuleInit() {
    this.expireTransactions().catch((err) => {
      console.error('Failed to run initial transaction expiration cleanup:', err);
    });
    this.cleanupInterval = setInterval(() => {
      this.expireTransactions().catch((err) => {
        console.error('Failed to run periodic transaction expiration cleanup:', err);
      });
    }, 60 * 1000);
  }

  onModuleDestroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }

  async expireTransactions() {
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    const result = await this.transactionModel.updateMany(
      {
        type: TransactionType.DEPOSIT,
        status: { $in: [TransactionStatus.PENDING, TransactionStatus.PROCESSING] },
        createdAt: { $lt: fifteenMinutesAgo },
      },
      { $set: { status: TransactionStatus.FAILED } },
    );
    if (result.modifiedCount > 0) {
      console.log(`Auto-expired ${result.modifiedCount} pending/processing deposit transactions.`);
    }

    // Auto-refund pending withdrawals older than 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const pendingWithdrawals = await this.transactionModel.find({
      type: TransactionType.WITHDRAW,
      status: TransactionStatus.PENDING,
      createdAt: { $lt: fiveMinutesAgo },
    });

    for (const tx of pendingWithdrawals) {
      const session = await this.connection.startSession();
      session.startTransaction();
      try {
        // Refund back to the user's wallet
        await this.walletModel.findByIdAndUpdate(
          tx.fromWalletId,
          { $inc: { balance: tx.amount } },
          { session }
        );

        tx.status = TransactionStatus.CANCELLED;
        tx.description = 'Tự động hoàn tiền do quá thời gian xử lý (5 phút)';
        await tx.save({ session });

        await session.commitTransaction();

        const wallet = await this.walletModel.findById(tx.fromWalletId);
        this.notificationGateway.emitBalanceUpdated(tx.userId.toString(), wallet?.balance ?? 0);
        
        await this.notificationsService.create(
          tx.userId.toString(),
          'Rút tiền tự động hủy',
          `Yêu cầu rút ${tx.amount.toLocaleString('vi-VN')}đ đã tự động hủy do quá 5 phút chưa được duyệt, tiền đã hoàn vào ví`,
          'withdraw',
        );

        await this.auditModel.create({
          userId: tx.userId,
          action: 'WITHDRAW_AUTO_REFUND',
          resource: 'transaction',
          metadata: { transactionId: tx._id, amount: tx.amount },
        });

        console.log(`Auto-refunded expired withdrawal: ${tx.reference}`);
      } catch (e) {
        await session.abortTransaction();
        console.error(`Failed to auto-expire withdrawal ${tx.reference}:`, e);
      } finally {
        session.endSession();
      }
    }
  }

  async getHistory(userId: string, page = 1, limit = 20, type?: string, status?: string) {
    // Auto-expire deposits older than 15 minutes for this user
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    await this.transactionModel.updateMany(
      {
        userId: new Types.ObjectId(userId),
        type: TransactionType.DEPOSIT,
        status: { $in: [TransactionStatus.PENDING, TransactionStatus.PROCESSING] },
        createdAt: { $lt: fifteenMinutesAgo },
      },
      { $set: { status: TransactionStatus.FAILED } },
    );

    const filter: Record<string, unknown> = { userId: new Types.ObjectId(userId) };
    if (type) filter.type = type;
    if (status) filter.status = status;
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.transactionModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      this.transactionModel.countDocuments(filter),
    ]);
    return { items, total, page, limit };
  }

  async getById(userId: string, id: string) {
    // Auto-expire this specific transaction if it is an expired deposit
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    await this.transactionModel.updateOne(
      {
        _id: id,
        userId: new Types.ObjectId(userId),
        type: TransactionType.DEPOSIT,
        status: { $in: [TransactionStatus.PENDING, TransactionStatus.PROCESSING] },
        createdAt: { $lt: fifteenMinutesAgo },
      },
      { $set: { status: TransactionStatus.FAILED } },
    );

    const tx = await this.transactionModel.findOne({
      _id: id,
      userId: new Types.ObjectId(userId),
    });
    if (!tx) {
      throw new BusinessException('Giao dịch không tồn tại', ErrorCodes.TRANSACTION_NOT_FOUND, HttpStatus.NOT_FOUND);
    }
    return tx;
  }

  async createTopup(userId: string, dto: TopupDto) {
    // Check bank account constraint
    const hasBankAccount = await this.bankService.hasActiveBankAccount(userId);
    if (!hasBankAccount) {
      throw new BusinessException(
        'Bạn cần liên kết tài khoản ngân hàng trước khi nạp tiền. Vào Cá nhân > Liên kết ngân hàng.',
        ErrorCodes.VALIDATION_ERROR,
        HttpStatus.BAD_REQUEST,
      );
    }

    const wallet = await this.walletModel.findOne({ userId: new Types.ObjectId(userId), isActive: true });
    if (!wallet) {
      throw new BusinessException('Không tìm thấy ví', ErrorCodes.WALLET_NOT_FOUND, HttpStatus.NOT_FOUND);
    }
    const reference = `TOP-${uuidv4()}`;
    const tx = await this.transactionModel.create({
      reference,
      type: TransactionType.DEPOSIT,
      status: TransactionStatus.PENDING,
      userId: wallet.userId,
      toWalletId: wallet._id,
      amount: dto.amount,
      metadata: { paymentCode: reference, paymentMethod: dto.paymentMethod || 'vietcombank' },
    });

    let paymentUrl: string | undefined;
    if (dto.paymentMethod === 'vnpay') {
      paymentUrl = this.generateVnpayUrl(reference, dto.amount, 'real');
    } else if (dto.paymentMethod === 'vnpay_local') {
      paymentUrl = this.generateVnpayUrl(reference, dto.amount, 'local');
    }

    return {
      transactionId: tx._id,
      reference,
      amount: dto.amount,
      paymentCode: reference,
      paymentUrl,
      message: dto.paymentMethod === 'vnpay' || dto.paymentMethod === 'vnpay_local'
        ? 'Vui lòng thanh toán qua cổng VNPay.'
        : 'Vui lòng chuyển khoản với mã tham chiếu trên. Số dư sẽ cập nhật sau khi xác nhận.',
    };
  }

  async processTopupWebhook(reference: string, amount: number, signature?: string) {
    const secret = process.env.WEBHOOK_SECRET || 'dev-webhook';
    if (signature) {
      const expected = createHmac('sha256', secret).update(`${reference}:${amount}`).digest('hex');
      if (signature !== expected) {
        throw new BusinessException('Chữ ký webhook không hợp lệ', ErrorCodes.FORBIDDEN, HttpStatus.FORBIDDEN);
      }
    }

    const idemKey = `webhook:${reference}`;
    if (await this.redisService.exists(idemKey)) {
      return { message: 'Webhook đã xử lý' };
    }

    const tx = await this.transactionModel.findOne({ reference, type: TransactionType.DEPOSIT });
    if (!tx || tx.status === TransactionStatus.SUCCESS) {
      return { message: 'Giao dịch không tồn tại hoặc đã xử lý' };
    }

    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      await this.walletModel.findByIdAndUpdate(
        tx.toWalletId,
        { $inc: { balance: amount } },
        { session },
      );
      tx.status = TransactionStatus.SUCCESS;
      tx.amount = amount;
      await tx.save({ session });
      await session.commitTransaction();
      await this.redisService.set(idemKey, '1', 86400);

      const wallet = await this.walletModel.findById(tx.toWalletId);
      const txUserId = tx.userId.toString();
      this.notificationGateway.emitBalanceUpdated(txUserId, wallet?.balance ?? 0);
      await this.notificationsService.create(txUserId, 'Nạp tiền thành công', `Số dư +${amount.toLocaleString('vi-VN')}đ`, 'topup');
      await this.auditModel.create({ userId: tx.userId, action: 'TOPUP_SUCCESS', resource: 'transaction', metadata: { reference } });

      // Send email receipt
      const userForEmail = await this.userModel.findById(tx.userId);
      if (userForEmail) {
        void this.mailerService.sendTransactionEmail({
          to: userForEmail.email,
          type: 'topup',
          amount,
          reference,
          newBalance: wallet?.balance,
          date: new Date(),
        });
      }

      return { message: 'Nạp tiền thành công', reference };
    } catch (e) {
      await session.abortTransaction();
      throw e;
    } finally {
      session.endSession();
    }
  }

  async createBankTransfer(userId: string, dto: BankTransferDto) {
    // Check bank account constraint
    const hasBankAccount = await this.bankService.hasActiveBankAccount(userId);
    if (!hasBankAccount) {
      throw new BusinessException(
        'Bạn cần liên kết tài khoản ngân hàng trước khi chuyển khoản. Vào Cá nhân > Liên kết ngân hàng.',
        ErrorCodes.VALIDATION_ERROR,
        HttpStatus.BAD_REQUEST,
      );
    }

    const senderUser = await this.userModel.findById(userId);
    if (!senderUser) {
      throw new BusinessException('Người dùng không tồn tại', ErrorCodes.NOT_FOUND, HttpStatus.NOT_FOUND);
    }
    const limit = senderUser.transferLimit ?? 50_000_000;
    if (dto.amount > limit) {
      throw new BusinessException(
        `Giao dịch vượt quá hạn mức chuyển tiền (Hạn mức hiện tại: ${limit.toLocaleString('vi-VN')}đ)`,
        ErrorCodes.VALIDATION_ERROR,
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.authService.assertTransactionOtp(userId, dto.amount, 0, dto.otpCode);

    const wallet = await this.walletModel.findOne({ userId: new Types.ObjectId(userId), isActive: true });
    if (!wallet) {
      throw new BusinessException('Không tìm thấy ví', ErrorCodes.WALLET_NOT_FOUND, HttpStatus.NOT_FOUND);
    }
    if (wallet.balance < dto.amount) {
      throw new BusinessException('Số dư không đủ', ErrorCodes.INSUFFICIENT_BALANCE, HttpStatus.BAD_REQUEST);
    }

    const bank = await this.bankService.resolveTransferAccount(userId, dto);
    const recipientWallet = await this.walletModel.findOne({ userId: new Types.ObjectId(bank.userId), isActive: true });
    if (!recipientWallet) {
      throw new BusinessException('Ví người nhận không tồn tại', ErrorCodes.WALLET_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    const reference = `BTX-${uuidv4()}`;
    const recipientReference = `RXB-${uuidv4()}`;
    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      await this.walletModel.findByIdAndUpdate(wallet._id, { $inc: { balance: -dto.amount } }, { session });
      await this.walletModel.findByIdAndUpdate(recipientWallet._id, { $inc: { balance: dto.amount } }, { session });

      const [tx] = await this.transactionModel.create(
        [
          {
            reference,
            type: TransactionType.BANK_TRANSFER,
            status: TransactionStatus.SUCCESS,
            userId: wallet.userId,
            fromWalletId: wallet._id,
            toWalletId: recipientWallet._id,
            amount: dto.amount,
            description: dto.description || `Chuyển khoản tới tài khoản ${bank.bankName} của ${bank.accountName}`,
            metadata: {
              bankCode: bank.bankCode,
              bankName: bank.bankName,
              accountNumber: `****${bank.accountNumber.slice(-4)}`,
              accountName: bank.accountName,
              ...(bank.bankAccountId ? { bankAccountId: bank.bankAccountId } : {}),
            },
          },
        ],
        { session },
      );

      const senderUser = await this.userModel.findById(userId);

      const [txIn] = await this.transactionModel.create(
        [
          {
            reference: recipientReference,
            type: TransactionType.RECEIVE,
            status: TransactionStatus.SUCCESS,
            userId: new Types.ObjectId(bank.userId),
            fromWalletId: wallet._id,
            toWalletId: recipientWallet._id,
            amount: dto.amount,
            description: `Nhận tiền chuyển khoản ngân hàng ${bank.bankName} - ****${bank.accountNumber.slice(-4)} từ ${senderUser?.fullName || 'Người dùng'}`,
            metadata: {
              bankCode: bank.bankCode,
              bankName: bank.bankName,
              accountNumber: `****${bank.accountNumber.slice(-4)}`,
              accountName: bank.accountName,
              senderName: senderUser?.fullName,
            },
          },
        ],
        { session },
      );

      await session.commitTransaction();

      const updated = await this.walletModel.findById(wallet._id);
      const recipientUpdated = await this.walletModel.findById(recipientWallet._id);

      this.notificationGateway.emitBalanceUpdated(userId, updated?.balance ?? 0);
      this.notificationGateway.emitBalanceUpdated(bank.userId, recipientUpdated?.balance ?? 0);

      this.notificationGateway.emitTransactionCompleted(userId, {
        transactionId: tx._id,
        reference,
        amount: dto.amount,
        newBalance: updated?.balance,
      });

      this.notificationGateway.emitTransactionCompleted(bank.userId, {
        transactionId: txIn._id,
        reference: recipientReference,
        amount: dto.amount,
        newBalance: recipientUpdated?.balance,
      });

      await this.notificationsService.create(
        userId,
        'Chuyển khoản ngân hàng thành công',
        `Bạn đã chuyển thành công ${dto.amount.toLocaleString('vi-VN')}đ tới tài khoản ${bank.accountName} (${bank.bankName})`,
        'transfer',
      );

      await this.notificationsService.create(
        bank.userId,
        'Nhận tiền chuyển khoản ngân hàng',
        `Tài khoản ngân hàng liên kết ${bank.bankName} của bạn nhận được +${dto.amount.toLocaleString('vi-VN')}đ từ ${senderUser?.fullName || 'Người dùng'} (số dư ví đã được cộng tương ứng)`,
        'transfer',
      );

      // Send email receipt to sender
      if (senderUser) {
        void this.mailerService.sendTransactionEmail({
          to: senderUser.email,
          type: 'transfer_out',
          amount: dto.amount,
          reference,
          recipientName: bank.accountName,
          description: dto.description,
          newBalance: updated?.balance,
          date: new Date(),
        });
      }

      // Send email receipt to receiver
      const receiverUser = await this.userModel.findById(bank.userId);
      if (receiverUser) {
        void this.mailerService.sendTransactionEmail({
          to: receiverUser.email,
          type: 'transfer_in',
          amount: dto.amount,
          reference: recipientReference,
          senderName: senderUser?.fullName || 'Người dùng',
          description: `Nhận chuyển khoản ngân hàng vào tài khoản liên kết ${bank.bankName}`,
          newBalance: recipientUpdated?.balance,
          date: new Date(),
        });
      }

      return {
        transactionId: tx._id,
        reference,
        amount: dto.amount,
        status: 'SUCCESS',
        bankName: bank.bankName,
        accountNumberMasked: `****${bank.accountNumber.slice(-4)}`,
        newBalance: updated?.balance,
      };
    } catch (e) {
      await session.abortTransaction();
      throw e;
    } finally {
      session.endSession();
    }
  }

  async createWithdraw(userId: string, dto: WithdrawDto) {
    // Check bank account constraint
    const hasBankAccount = await this.bankService.hasActiveBankAccount(userId);
    if (!hasBankAccount) {
      throw new BusinessException(
        'Bạn cần liên kết tài khoản ngân hàng trước khi rút tiền. Vào Cá nhân > Liên kết ngân hàng.',
        ErrorCodes.VALIDATION_ERROR,
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.authService.assertTransactionOtp(userId, dto.amount, 100000, dto.otpCode);

    const wallet = await this.walletModel.findOne({ userId: new Types.ObjectId(userId), isActive: true });
    if (!wallet) {
      throw new BusinessException('Không tìm thấy ví', ErrorCodes.WALLET_NOT_FOUND, HttpStatus.NOT_FOUND);
    }
    if (wallet.balance < dto.amount) {
      throw new BusinessException('Số dư không đủ', ErrorCodes.INSUFFICIENT_BALANCE, HttpStatus.BAD_REQUEST);
    }

    const reference = `WDR-${uuidv4()}`;
    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      await this.walletModel.findByIdAndUpdate(wallet._id, { $inc: { balance: -dto.amount } }, { session });
      const [tx] = await this.transactionModel.create(
        [
          {
            reference,
            type: TransactionType.WITHDRAW,
            status: TransactionStatus.PENDING,
            userId: wallet.userId,
            fromWalletId: wallet._id,
            amount: dto.amount,
            metadata: { bankAccountId: dto.bankAccountId },
          },
        ],
        { session },
      );
      await session.commitTransaction();
      const updatedWallet = await this.walletModel.findById(wallet._id);
      await this.auditModel.create({ userId: wallet.userId, action: 'WITHDRAW_REQUEST', resource: 'transaction', metadata: { reference } });

      // Send email receipt
      const withdrawUser = await this.userModel.findById(userId);
      if (withdrawUser) {
        void this.mailerService.sendTransactionEmail({
          to: withdrawUser.email,
          type: 'withdraw',
          amount: dto.amount,
          reference,
          newBalance: updatedWallet?.balance,
          date: new Date(),
        });
      }

      return { transactionId: tx._id, reference, amount: dto.amount, status: 'PENDING' };
    } catch (e) {
      await session.abortTransaction();
      throw e;
    } finally {
      session.endSession();
    }
  }

  async approveWithdraw(transactionId: string, approve: boolean, adminId: string) {
    const tx = await this.transactionModel.findById(transactionId);
    if (!tx || tx.type !== TransactionType.WITHDRAW || tx.status !== TransactionStatus.PENDING) {
      throw new BusinessException('Giao dịch không hợp lệ', ErrorCodes.NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    if (approve) {
      tx.status = TransactionStatus.SUCCESS;
      await tx.save();
      await this.notificationsService.create(
        tx.userId.toString(),
        'Rút tiền thành công',
        `Yêu cầu rút ${tx.amount.toLocaleString('vi-VN')}đ đã được duyệt`,
        'withdraw',
      );
    } else {
      const session = await this.connection.startSession();
      session.startTransaction();
      try {
        await this.walletModel.findByIdAndUpdate(tx.fromWalletId, { $inc: { balance: tx.amount } }, { session });
        tx.status = TransactionStatus.CANCELLED;
        await tx.save({ session });
        await session.commitTransaction();
        const wallet = await this.walletModel.findById(tx.fromWalletId);
        this.notificationGateway.emitBalanceUpdated(tx.userId.toString(), wallet?.balance ?? 0);
        await this.notificationsService.create(
          tx.userId.toString(),
          'Rút tiền bị từ chối',
          `Yêu cầu rút ${tx.amount.toLocaleString('vi-VN')}đ đã bị từ chối, tiền đã hoàn vào ví`,
          'withdraw',
        );
      } catch (e) {
        await session.abortTransaction();
        throw e;
      } finally {
        session.endSession();
      }
    }
    await this.auditModel.create({
      userId: new Types.ObjectId(adminId),
      action: approve ? 'WITHDRAW_APPROVE' : 'WITHDRAW_REJECT',
      resource: 'transaction',
      metadata: { transactionId },
    });
    return { message: approve ? 'Đã duyệt rút tiền' : 'Đã từ chối và hoàn tiền' };
  }

  async qrPayment(
    userId: string,
    walletId: string,
    qrData: string,
    amount?: number,
    otpCode?: string,
    description?: string,
  ) {
    // Check bank account constraint
    const hasBankAccount = await this.bankService.hasActiveBankAccount(userId);
    if (!hasBankAccount) {
      throw new BusinessException(
        'Bạn cần liên kết tài khoản ngân hàng trước khi thanh toán QR. Vào Cá nhân > Liên kết ngân hàng.',
        ErrorCodes.VALIDATION_ERROR,
        HttpStatus.BAD_REQUEST,
      );
    }

    const parsed = this.parseQr(qrData);
    const payAmount = amount ?? parsed.amount;
    if (!payAmount || payAmount < 1000) {
      throw new BusinessException('Số tiền không hợp lệ', ErrorCodes.VALIDATION_ERROR);
    }

    const senderUserInfo = await this.userModel.findById(userId);
    if (!senderUserInfo) {
      throw new BusinessException('Không tìm thấy người gửi', ErrorCodes.NOT_FOUND, HttpStatus.NOT_FOUND);
    }
    const limit = senderUserInfo.transferLimit ?? 50_000_000;
    if (payAmount > limit) {
      throw new BusinessException(
        `Giao dịch vượt quá hạn mức thanh toán (Hạn mức hiện tại: ${limit.toLocaleString('vi-VN')}đ)`,
        ErrorCodes.VALIDATION_ERROR,
        HttpStatus.BAD_REQUEST,
      );
    }

    const fromWallet = await this.walletModel.findOne({ _id: walletId, userId: new Types.ObjectId(userId) });
    if (!fromWallet) throw new BusinessException('Không tìm thấy ví', ErrorCodes.WALLET_NOT_FOUND, HttpStatus.NOT_FOUND);

    const recipient = await this.userModel.findOne({ email: parsed.merchantEmail?.toLowerCase() });
    if (!recipient) throw new BusinessException('Người nhận QR không tồn tại', ErrorCodes.INVALID_QR);
    if (!recipient.isActive) {
      throw new BusinessException('Tài khoản nhận đang bị khóa', ErrorCodes.VALIDATION_ERROR);
    }
    if (recipient._id.equals(fromWallet.userId)) {
      throw new BusinessException('Không thể tự thanh toán hoặc chuyển tiền cho chính mình', ErrorCodes.VALIDATION_ERROR);
    }

    const toWallet = await this.walletModel.findOne({ userId: recipient._id });
    if (!toWallet) throw new BusinessException('Ví người nhận không tồn tại', ErrorCodes.WALLET_NOT_FOUND, HttpStatus.NOT_FOUND);
    if (fromWallet.balance < payAmount) {
      throw new BusinessException('Số dư không đủ', ErrorCodes.INSUFFICIENT_BALANCE);
    }

    // Assert transaction OTP if necessary
    await this.authService.assertTransactionOtp(userId, payAmount, 500000, otpCode);

    const reference = `QR-${uuidv4()}`;
    const recipientReference = `RXQ-${uuidv4()}`;
    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      await this.walletModel.findByIdAndUpdate(fromWallet._id, { $inc: { balance: -payAmount } }, { session });
      await this.walletModel.findByIdAndUpdate(toWallet._id, { $inc: { balance: payAmount } }, { session });

      const [tx] = await this.transactionModel.create(
        [
          {
            reference,
            type: TransactionType.PAYMENT,
            status: TransactionStatus.SUCCESS,
            userId: fromWallet.userId,
            fromWalletId: fromWallet._id,
            toWalletId: toWallet._id,
            amount: payAmount,
            description: description || `Thanh toán QR tới ${recipient.fullName}`,
            metadata: { qrMerchant: parsed.merchantEmail },
          },
        ],
        { session },
      );

      const [txIn] = await this.transactionModel.create(
        [
          {
            reference: recipientReference,
            type: TransactionType.RECEIVE,
            status: TransactionStatus.SUCCESS,
            userId: recipient._id,
            fromWalletId: fromWallet._id,
            toWalletId: toWallet._id,
            amount: payAmount,
            description: description || `Nhận tiền QR từ ${senderUserInfo.fullName}`,
            metadata: { senderEmail: senderUserInfo.email, senderName: senderUserInfo.fullName },
          },
        ],
        { session },
      );

      await session.commitTransaction();
      const updated = await this.walletModel.findById(fromWallet._id);
      const recipientUpdated = await this.walletModel.findById(toWallet._id);

      this.notificationGateway.emitBalanceUpdated(userId, updated?.balance ?? 0);
      this.notificationGateway.emitBalanceUpdated(recipient._id.toString(), recipientUpdated?.balance ?? 0);

      this.notificationGateway.emitTransactionCompleted(userId, {
        transactionId: tx._id,
        reference,
        amount: payAmount,
        newBalance: updated?.balance,
      });
      this.notificationGateway.emitTransactionCompleted(recipient._id.toString(), {
        transactionId: txIn._id,
        reference: txIn.reference,
        amount: payAmount,
        newBalance: recipientUpdated?.balance,
      });

      await this.notificationsService.create(
        userId,
        'Thanh toán QR thành công',
        `Bạn đã thanh toán ${payAmount.toLocaleString('vi-VN')}đ cho ${recipient.fullName}`,
        'transfer',
      );
      await this.notificationsService.create(
        recipient._id.toString(),
        'Nhận tiền từ QR',
        `Bạn nhận được ${payAmount.toLocaleString('vi-VN')}đ từ QR của ${senderUserInfo.fullName}`,
        'transfer',
      );

      // Send email receipts
      void this.mailerService.sendTransactionEmail({
        to: senderUserInfo.email,
        type: 'qr_payment',
        amount: payAmount,
        reference,
        recipientName: recipient.fullName,
        recipientEmail: recipient.email,
        newBalance: updated?.balance,
        date: new Date(),
      });
      void this.mailerService.sendTransactionEmail({
        to: recipient.email,
        type: 'transfer_in',
        amount: payAmount,
        reference,
        senderName: senderUserInfo.fullName,
        senderEmail: senderUserInfo.email,
        newBalance: recipientUpdated?.balance,
        date: new Date(),
      });

      return { transactionId: tx._id, reference, amount: payAmount, newBalance: updated?.balance };
    } catch (e) {
      await session.abortTransaction();
      throw e;
    } finally {
      session.endSession();
    }
  }

  generateQr(userId: string, amount?: number) {
    const user = this.userModel.findById(userId);
    return user.then((u) => {
      if (!u) throw new BusinessException('User không tồn tại', ErrorCodes.NOT_FOUND, HttpStatus.NOT_FOUND);
      const payload = JSON.stringify({ merchantEmail: u.email, amount: amount ?? null });
      const sig = createHmac('sha256', process.env.QR_HMAC_SECRET || 'dev-qr').update(payload).digest('hex');
      return { qrData: Buffer.from(JSON.stringify({ payload, sig })).toString('base64') };
    });
  }

  private parseQr(qrData: string) {
    try {
      const decoded = JSON.parse(Buffer.from(qrData, 'base64').toString());
      const inner = JSON.parse(decoded.payload);
      const expected = createHmac('sha256', process.env.QR_HMAC_SECRET || 'dev-qr')
        .update(decoded.payload)
        .digest('hex');
      if (decoded.sig !== expected) {
        throw new BusinessException('QR không hợp lệ', ErrorCodes.INVALID_QR);
      }
      return inner as { merchantEmail: string; amount?: number };
    } catch {
      throw new BusinessException('QR không hợp lệ', ErrorCodes.INVALID_QR);
    }
  }

  private generateVnpayUrl(reference: string, amount: number, mode?: 'local' | 'real'): string {
    const tmnCode = this.configService.get<string>('VNP_TMN_CODE') || 'GKSWJ3QC';
    const secret = this.configService.get<string>('VNP_HASH_SECRET') || 'EJ55B4RE14FBBVBL6C52RIWBVOYE13V6';
    const vnpUrl = this.configService.get<string>('VNP_URL') || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
    const returnUrl = this.configService.get<string>('VNP_RETURN_URL') || 'http://localhost:5173/topup/vnpay-callback';
    const sandboxMode = mode || this.configService.get<string>('VNP_SANDBOX_MODE') || 'production';

    const date = new Date();
    // Format date to local GMT+7 yyyyMMddHHmmss
    const tzOffset = 7 * 60; // in minutes
    const localTime = new Date(date.getTime() + tzOffset * 60 * 1000);
    const pad = (n: number) => String(n).padStart(2, '0');
    const createDate =
      localTime.getUTCFullYear() +
      pad(localTime.getUTCMonth() + 1) +
      pad(localTime.getUTCDate()) +
      pad(localTime.getUTCHours()) +
      pad(localTime.getUTCMinutes()) +
      pad(localTime.getUTCSeconds());

    // Extract vnpay host from the vnpUrl (e.g. https://sandbox.vnpayment.vn)
    const host = vnpUrl.includes('?') ? vnpUrl.split('?')[0] : vnpUrl;
    const hostUrlObj = new URL(host);
    const vnpayHost = `${hostUrlObj.protocol}//${hostUrlObj.host}`;

    const vnpay = new VNPay({
      tmnCode,
      secureSecret: secret,
      vnpayHost,
      hashAlgorithm: HashAlgorithm.SHA512,
    });

    let url = vnpay.buildPaymentUrl({
      vnp_Amount: amount, // vnpay library takes amount in VND
      vnp_IpAddr: '127.0.0.1',
      vnp_TxnRef: reference,
      vnp_OrderInfo: `Nap_tien_vi_HKi_Wallet_${reference}`,
      vnp_OrderType: 'other' as any,
      vnp_ReturnUrl: returnUrl,
      vnp_CreateDate: Number(createDate),
    });

    if (sandboxMode === 'local') {
      const realBaseUrl = host.includes('?') ? host.split('?')[0] : host;
      // Redirect to frontend local sandbox checkout page
      const localBaseUrl = 'http://localhost:5173/sandbox/vnpay-mock';
      url = url.replace(realBaseUrl, localBaseUrl);
    }

    return url;
  }

  async verifyVnpayPayment(queryParams: Record<string, string>) {
    const tmnCode = this.configService.get<string>('VNP_TMN_CODE') || 'GKSWJ3QC';
    const secret = this.configService.get<string>('VNP_HASH_SECRET') || 'EJ55B4RE14FBBVBL6C52RIWBVOYE13V6';

    const vnpay = new VNPay({
      tmnCode,
      secureSecret: secret,
      vnpayHost: 'https://sandbox.vnpayment.vn',
      hashAlgorithm: HashAlgorithm.SHA512,
    });

    const verify = vnpay.verifyReturnUrl(queryParams as any);

    if (!verify.isVerified) {
      throw new BusinessException('Chữ ký VNPay không hợp lệ', ErrorCodes.FORBIDDEN, HttpStatus.FORBIDDEN);
    }

    const reference = verify.vnp_TxnRef;
    const responseCode = verify.vnp_ResponseCode;
    const amount = Number(verify.vnp_Amount); // in VND

    const lockKey = `lock:vnpay:${reference}`;
    const acquired = await this.redisService.getClient().set(lockKey, '1', 'EX', 5, 'NX');
    if (!acquired) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      const doubleCheckTx = await this.transactionModel.findOne({ reference });
      if (doubleCheckTx && doubleCheckTx.status === TransactionStatus.SUCCESS) {
        return { isVerified: true, message: 'Giao dịch đã được xử lý trước đó', reference };
      }
      throw new BusinessException(
        'Giao dịch đang được xử lý bởi yêu cầu khác, vui lòng tải lại trang.',
        ErrorCodes.VALIDATION_ERROR,
        HttpStatus.CONFLICT,
      );
    }

    try {
      const tx = await this.transactionModel.findOne({ reference, type: TransactionType.DEPOSIT });
      if (!tx) {
        throw new BusinessException('Giao dịch không tồn tại', ErrorCodes.TRANSACTION_NOT_FOUND, HttpStatus.NOT_FOUND);
      }

      if (tx.status === TransactionStatus.SUCCESS) {
        return { isVerified: true, message: 'Giao dịch đã được xử lý trước đó', reference };
      }

      if (responseCode === '00') {
        // Success! Update balance
        const session = await this.connection.startSession();
        session.startTransaction();
        try {
          await this.walletModel.findByIdAndUpdate(
            tx.toWalletId,
            { $inc: { balance: amount } },
            { session },
          );
          tx.status = TransactionStatus.SUCCESS;
          tx.amount = amount;
          await tx.save({ session });
          await session.commitTransaction();

          const wallet = await this.walletModel.findById(tx.toWalletId);
          const txUserId = tx.userId.toString();
          this.notificationGateway.emitBalanceUpdated(txUserId, wallet?.balance ?? 0);
          await this.notificationsService.create(
            txUserId,
            'Nạp tiền VNPay thành công',
            `Số dư +${amount.toLocaleString('vi-VN')}đ qua VNPay`,
            'topup',
          );
          await this.auditModel.create({
            userId: tx.userId,
            action: 'TOPUP_VNPAY_SUCCESS',
            resource: 'transaction',
            metadata: { reference },
          });

          // Send email receipt
          const userForEmail = await this.userModel.findById(tx.userId);
          if (userForEmail) {
            void this.mailerService.sendTransactionEmail({
              to: userForEmail.email,
              type: 'topup',
              amount,
              reference,
              newBalance: wallet?.balance,
              date: new Date(),
            });
          }

          return { isVerified: true, message: 'Nạp tiền thành công', reference };
        } catch (e) {
          await session.abortTransaction();
          throw e;
        } finally {
          session.endSession();
        }
      } else {
        tx.status = TransactionStatus.CANCELLED;
        await tx.save();
        return { isVerified: false, message: 'Giao dịch VNPay thất bại hoặc bị hủy', reference };
      }
    } finally {
      await this.redisService.del(lockKey);
    }
  }

  async signVnpayMockCallback(dto: {
    vnp_Amount: string;
    vnp_TxnRef: string;
    vnp_OrderInfo: string;
    vnp_ReturnUrl: string;
    status: 'success' | 'fail';
  }) {
    const sandboxMode = this.configService.get<string>('VNP_SANDBOX_MODE') || 'production';
    if (sandboxMode !== 'local') {
      throw new BusinessException(
        'Tính năng giả lập VNPay chỉ khả dụng trong chế độ local sandbox.',
        ErrorCodes.FORBIDDEN,
        HttpStatus.FORBIDDEN,
      );
    }

    const tmnCode = this.configService.get<string>('VNP_TMN_CODE') || 'GKSWJ3QC';
    const secret = this.configService.get<string>('VNP_HASH_SECRET') || 'EJ55B4RE14FBBVBL6C52RIWBVOYE13V6';

    const date = new Date();
    const tzOffset = 7 * 60; // GMT+7
    const localTime = new Date(date.getTime() + tzOffset * 60 * 1000);
    const pad = (n: number) => String(n).padStart(2, '0');
    const payDate =
      localTime.getUTCFullYear() +
      pad(localTime.getUTCMonth() + 1) +
      pad(localTime.getUTCDate()) +
      pad(localTime.getUTCHours()) +
      pad(localTime.getUTCMinutes()) +
      pad(localTime.getUTCSeconds());

    const isSuccess = dto.status === 'success';
    const responseCode = isSuccess ? '00' : '24';
    const transactionStatus = isSuccess ? '00' : '02';

    const queryParams: Record<string, string> = {
      vnp_Amount: dto.vnp_Amount,
      vnp_BankCode: 'NCB',
      vnp_BankTranNo: `VNP${Date.now()}`,
      vnp_CardType: 'ATM',
      vnp_OrderInfo: dto.vnp_OrderInfo,
      vnp_PayDate: payDate,
      vnp_ResponseCode: responseCode,
      vnp_TmnCode: tmnCode,
      vnp_TransactionNo: String(Math.floor(10000000 + Math.random() * 90000000)),
      vnp_TransactionStatus: transactionStatus,
      vnp_TxnRef: dto.vnp_TxnRef,
    };

    // Sort and sign using HMAC SHA512
    const sortedKeys = Object.keys(queryParams).sort();
    const signData = sortedKeys
      .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(queryParams[key])}`)
      .join('&');

    const hmac = createHmac('sha512', secret);
    const secureHash = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    const callbackUrl = new URL(dto.vnp_ReturnUrl);
    Object.entries(queryParams).forEach(([key, val]) => {
      callbackUrl.searchParams.set(key, val);
    });
    callbackUrl.searchParams.set('vnp_SecureHash', secureHash);

    return { callbackUrl: callbackUrl.toString() };
  }

  async sendVnpayMockOtp(txnRef: string) {
    const tx = await this.transactionModel.findOne({ reference: txnRef, type: TransactionType.DEPOSIT });
    if (!tx) {
      throw new BusinessException('Giao dịch không tồn tại', ErrorCodes.TRANSACTION_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    const user = await this.userModel.findById(tx.userId);
    if (!user) {
      throw new BusinessException('Người dùng không tồn tại', ErrorCodes.NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    await this.redisService.set(`mock_otp:${txnRef}`, code, 300);

    let emailSent = false;
    try {
      const mailRes = await this.mailerService.sendOtpEmail({
        to: user.email,
        code,
        purpose: 'transaction',
      });
      if (mailRes && mailRes.sent) {
        emailSent = true;
      }
    } catch (err) {
      console.error('Failed to send VNPAY mock OTP email:', err);
    }

    // Mask email for response display
    const rawEmail = user.email.trim();
    const parts = rawEmail.split('@');
    let maskedEmail = rawEmail;
    if (parts.length === 2) {
      const name = parts[0];
      const domain = parts[1];
      maskedEmail = name.length > 3 
        ? name.slice(0, 3) + '***@' + domain
        : name.slice(0, 1) + '***@' + domain;
    }

    console.log(`[VNPAY MOCK OTP] Code for ${rawEmail}: ${code} (Email Sent: ${emailSent})`);

    return {
      success: true,
      email: maskedEmail,
      emailSent,
    };
  }

  async verifyVnpayMockOtp(txnRef: string, otpCode: string) {
    // Sandbox convenience: allow '123456' as generic fallback
    if (otpCode === '123456') {
      return { success: true };
    }

    const storedCode = await this.redisService.get(`mock_otp:${txnRef}`);
    if (!storedCode || storedCode !== otpCode) {
      throw new BusinessException('Mã OTP không hợp lệ hoặc đã hết hạn. Vui lòng thử lại.', ErrorCodes.INVALID_OTP, HttpStatus.BAD_REQUEST);
    }

    return { success: true };
  }
}
