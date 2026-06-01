import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model, Types } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { BusinessException } from '../../common/exceptions/business.exception';
import { ErrorCodes } from '../../common/constants/error-codes';
import { RedisService } from '../../common/redis/redis.service';
import { User, UserDocument } from '../users/schemas/user.schema';
import {
  Transaction,
  TransactionDocument,
  TransactionStatus,
  TransactionType,
} from '../transactions/schemas/transaction.schema';
import { Wallet, WalletDocument } from './schemas/wallet.schema';
import { TransferDto } from './dto/transfer.dto';
import { NotificationGateway } from '../../gateways/notification.gateway';
import { NotificationsService } from '../notifications/notifications.service';
import { AuthService } from '../auth/auth.service';
import { BankService } from '../bank/bank.service';
import { MailerService } from '../../common/mailer/mailer.service';

@Injectable()
export class WalletsService {
  constructor(
    @InjectModel(Wallet.name) private walletModel: Model<WalletDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Transaction.name) private transactionModel: Model<TransactionDocument>,
    @InjectConnection() private connection: Connection,
    private redisService: RedisService,
    private notificationGateway: NotificationGateway,
    private notificationsService: NotificationsService,
    private authService: AuthService,
    private bankService: BankService,
    private mailerService: MailerService,
  ) {}

  async getWalletByUserId(userId: string) {
    const wallet = await this.walletModel.findOne({ userId: new Types.ObjectId(userId), isActive: true });
    if (!wallet) {
      throw new BusinessException('Không tìm thấy ví', ErrorCodes.WALLET_NOT_FOUND, HttpStatus.NOT_FOUND);
    }
    return wallet;
  }

  async getBalance(userId: string) {
    const wallet = await this.getWalletByUserId(userId);
    return {
      walletId: wallet._id,
      balance: wallet.balance,
      currency: wallet.currency,
    };
  }

  async resolveWalletRecipient(recipient: string): Promise<{ fullName: string; email: string }> {
    const user = await this.userModel.findOne({
      $or: [{ email: recipient.toLowerCase() }, { phone: recipient }],
      isActive: true,
    });
    if (!user) {
      throw new BusinessException('Người nhận không tồn tại trong hệ thống', ErrorCodes.NOT_FOUND, HttpStatus.NOT_FOUND);
    }
    return { fullName: user.fullName, email: user.email };
  }

  async transfer(
    userId: string,
    walletId: string,
    dto: TransferDto,
    idempotencyKey?: string,
  ) {
    if (idempotencyKey) {
      const cached = await this.redisService.get(`idem:${idempotencyKey}`);
      if (cached) return JSON.parse(cached);
    }

    // Check bank account constraint
    const hasBankAccount = await this.bankService.hasActiveBankAccount(userId);
    if (!hasBankAccount) {
      throw new BusinessException(
        'Bạn cần liên kết tài khoản ngân hàng trước khi thực hiện chuyển tiền. Vui lòng vào Cá nhân > Liên kết ngân hàng.',
        ErrorCodes.VALIDATION_ERROR,
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.authService.assertTransactionOtp(userId, dto.amount, 500000, dto.otpCode);

    const fromWallet = await this.walletModel.findOne({
      _id: walletId,
      userId: new Types.ObjectId(userId),
      isActive: true,
    });
    if (!fromWallet) {
      throw new BusinessException('Không tìm thấy ví', ErrorCodes.WALLET_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    // Get sender info
    const senderUser = await this.userModel.findById(userId);
    if (!senderUser) {
      throw new BusinessException('Người dùng không tồn tại', ErrorCodes.NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    const recipientUser = await this.userModel.findOne({
      $or: [{ email: dto.recipient.toLowerCase() }, { phone: dto.recipient }],
      isActive: true,
    });
    if (!recipientUser) {
      throw new BusinessException('Người nhận không tồn tại', ErrorCodes.NOT_FOUND, HttpStatus.NOT_FOUND);
    }
    if (recipientUser._id.equals(fromWallet.userId)) {
      throw new BusinessException('Không thể chuyển cho chính mình', ErrorCodes.VALIDATION_ERROR);
    }

    const toWallet = await this.walletModel.findOne({ userId: recipientUser._id, isActive: true });
    if (!toWallet) {
      throw new BusinessException('Ví người nhận không tồn tại', ErrorCodes.WALLET_NOT_FOUND, HttpStatus.NOT_FOUND);
    }
    if (fromWallet.balance < dto.amount) {
      throw new BusinessException('Số dư không đủ', ErrorCodes.INSUFFICIENT_BALANCE, HttpStatus.BAD_REQUEST, {
        required: dto.amount,
        available: fromWallet.balance,
      });
    }

    const reference = `TXN-${uuidv4()}`;
    const session = await this.connection.startSession();
    session.startTransaction();
    let result: Record<string, unknown>;
    try {
      await this.walletModel.findByIdAndUpdate(
        fromWallet._id,
        { $inc: { balance: -dto.amount } },
        { session, new: true },
      );
      await this.walletModel.findByIdAndUpdate(
        toWallet._id,
        { $inc: { balance: dto.amount } },
        { session, new: true },
      );
      const [tx] = await this.transactionModel.create(
        [
          {
            reference,
            type: TransactionType.TRANSFER,
            status: TransactionStatus.SUCCESS,
            userId: fromWallet.userId,
            fromWalletId: fromWallet._id,
            toWalletId: toWallet._id,
            amount: dto.amount,
            fee: 0,
            description: dto.description,
            metadata: { recipientEmail: recipientUser.email },
          },
        ],
        { session },
      );
      await session.commitTransaction();

      const updatedFrom = await this.walletModel.findById(fromWallet._id);
      const updatedTo = await this.walletModel.findById(toWallet._id);

      result = {
        transactionId: tx._id,
        reference,
        amount: dto.amount,
        newBalance: updatedFrom?.balance,
      };

      this.notificationGateway.emitBalanceUpdated(userId, updatedFrom?.balance ?? 0);
      this.notificationGateway.emitBalanceUpdated(recipientUser._id.toString(), updatedTo?.balance ?? 0);
      this.notificationGateway.emitTransactionCompleted(userId, result);
      this.notificationGateway.emitTransactionCompleted(recipientUser._id.toString(), result);

      await this.notificationsService.create(
        userId,
        'Chuyển tiền thành công',
        `Bạn đã chuyển ${dto.amount.toLocaleString('vi-VN')}đ cho ${recipientUser.fullName}`,
        'transfer',
      );
      await this.notificationsService.create(
        recipientUser._id.toString(),
        'Nhận tiền',
        `Bạn nhận được ${dto.amount.toLocaleString('vi-VN')}đ từ ${senderUser.fullName}`,
        'transfer',
      );

      // Send email receipts (non-blocking)
      void this.mailerService.sendTransactionEmail({
        to: senderUser.email,
        type: 'transfer_out',
        amount: dto.amount,
        reference,
        recipientName: recipientUser.fullName,
        recipientEmail: recipientUser.email,
        description: dto.description,
        newBalance: updatedFrom?.balance,
        date: new Date(),
      });
      void this.mailerService.sendTransactionEmail({
        to: recipientUser.email,
        type: 'transfer_in',
        amount: dto.amount,
        reference,
        senderName: senderUser.fullName,
        senderEmail: senderUser.email,
        description: dto.description,
        newBalance: updatedTo?.balance,
        date: new Date(),
      });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }

    if (idempotencyKey) {
      await this.redisService.set(`idem:${idempotencyKey}`, JSON.stringify(result), 86400);
    }
    return result;
  }
}
