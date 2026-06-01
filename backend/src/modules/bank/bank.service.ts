import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';
import { Model, Types } from 'mongoose';
import { BusinessException } from '../../common/exceptions/business.exception';
import { ErrorCodes } from '../../common/constants/error-codes';
import { BankAccount, BankAccountDocument } from './schemas/bank-account.schema';

@Injectable()
export class BankService {
  private readonly key = scryptSync(process.env.COOKIE_SECRET || 'dev-key', 'salt', 32);

  constructor(@InjectModel(BankAccount.name) private bankModel: Model<BankAccountDocument>) {}

  private encrypt(text: string): string {
    const iv = randomBytes(16);
    const cipher = createCipheriv('aes-256-ctr', this.key, iv);
    const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
    return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
  }

  private decrypt(hash: string): string {
    const [ivHex, dataHex] = hash.split(':');
    const decipher = createDecipheriv('aes-256-ctr', this.key, Buffer.from(ivHex, 'hex'));
    return Buffer.concat([decipher.update(Buffer.from(dataHex, 'hex')), decipher.final()]).toString();
  }

  async addAccount(userId: string, dto: { bankCode: string; bankName: string; accountNumber: string; accountName: string }) {
    const account = await this.bankModel.create({
      userId: new Types.ObjectId(userId),
      bankCode: dto.bankCode,
      bankName: dto.bankName,
      accountNumber: this.encrypt(dto.accountNumber),
      accountName: dto.accountName,
    });
    return { id: account._id, bankName: account.bankName, accountName: account.accountName, isVerified: false };
  }

  async list(userId: string) {
    const accounts = await this.bankModel.find({ userId: new Types.ObjectId(userId), isActive: true });
    return accounts.map((a) => ({
      id: a._id,
      bankCode: a.bankCode,
      bankName: a.bankName,
      accountName: a.accountName,
      accountNumberMasked: `****${this.decrypt(a.accountNumber).slice(-4)}`,
      isVerified: a.isVerified,
    }));
  }

  async verify(userId: string, accountId: string) {
    const account = await this.bankModel.findOne({ _id: accountId, userId: new Types.ObjectId(userId) });
    if (!account) throw new BusinessException('Tài khoản không tồn tại', ErrorCodes.NOT_FOUND, HttpStatus.NOT_FOUND);
    account.isVerified = true;
    await account.save();
    return { message: 'Xác minh tài khoản ngân hàng thành công (mock)' };
  }

  async remove(userId: string, accountId: string) {
    await this.bankModel.findOneAndUpdate(
      { _id: accountId, userId: new Types.ObjectId(userId) },
      { isActive: false },
    );
    return { message: 'Đã xóa tài khoản ngân hàng' };
  }

  async resolveTransferAccount(
    userId: string,
    dto: { bankAccountId?: string; bankCode?: string; bankName?: string; accountNumber?: string; accountName?: string },
  ) {
    if (dto.bankAccountId) {
      const account = await this.bankModel.findOne({
        _id: dto.bankAccountId,
        userId: new Types.ObjectId(userId),
        isActive: true,
      });
      if (!account) {
        throw new BusinessException('Tài khoản ngân hàng không tồn tại', ErrorCodes.NOT_FOUND, HttpStatus.NOT_FOUND);
      }
      return {
        bankCode: account.bankCode,
        bankName: account.bankName,
        accountNumber: this.decrypt(account.accountNumber),
        accountName: account.accountName,
        bankAccountId: account._id.toString(),
      };
    }
    if (!dto.bankCode || !dto.bankName || !dto.accountNumber || !dto.accountName) {
      throw new BusinessException(
        'Vui lòng chọn ngân hàng và nhập đầy đủ số tài khoản, tên chủ tài khoản',
        ErrorCodes.VALIDATION_ERROR,
      );
    }

    // Check if bank account exists in our database
    const matchingAccount = await this.findAccountByDetails(dto.bankCode, dto.accountNumber);
    if (!matchingAccount) {
      throw new BusinessException(
        'Số tài khoản hoặc ngân hàng không tồn tại trong hệ thống',
        ErrorCodes.NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    // Verify accountName (case-insensitive)
    if (matchingAccount.accountName.toLowerCase() !== dto.accountName.toLowerCase()) {
      throw new BusinessException(
        `Tên chủ tài khoản không khớp. Hệ thống ghi nhận: ${matchingAccount.accountName}`,
        ErrorCodes.VALIDATION_ERROR,
        HttpStatus.BAD_REQUEST,
      );
    }

    return {
      bankCode: dto.bankCode,
      bankName: dto.bankName,
      accountNumber: dto.accountNumber,
      accountName: matchingAccount.accountName,
      bankAccountId: matchingAccount._id.toString(),
    };
  }

  async hasActiveBankAccount(userId: string): Promise<boolean> {
    const count = await this.bankModel.countDocuments({ userId: new Types.ObjectId(userId), isActive: true });
    return count > 0;
  }

  async resolveRecipient(dto: { bankCode: string; accountNumber: string }): Promise<{ accountName: string }> {
    const matchingAccount = await this.findAccountByDetails(dto.bankCode, dto.accountNumber);
    if (!matchingAccount) {
      throw new BusinessException(
        'Tài khoản ngân hàng không tồn tại trong hệ thống',
        ErrorCodes.NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }
    return { accountName: matchingAccount.accountName };
  }

  async findAccountByDetails(bankCode: string, accountNumber: string): Promise<BankAccountDocument | null> {
    const accounts = await this.bankModel.find({ bankCode, isActive: true });
    for (const acc of accounts) {
      try {
        const decrypted = this.decrypt(acc.accountNumber);
        if (decrypted === accountNumber) {
          return acc;
        }
      } catch (err) {
        // ignore decryption error
      }
    }
    return null;
  }

  async listAllAccounts(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [accounts, total] = await Promise.all([
      this.bankModel.find({ isActive: true })
        .populate('userId', 'fullName email phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.bankModel.countDocuments({ isActive: true }),
    ]);

    const items = accounts.map((a) => {
      let accountNumber = '********';
      try {
        accountNumber = this.decrypt(a.accountNumber);
      } catch (e) {
        // ignore
      }
      return {
        id: a._id.toString(),
        userId: a.userId,
        bankCode: a.bankCode,
        bankName: a.bankName,
        accountName: a.accountName,
        accountNumber,
        isVerified: a.isVerified,
        createdAt: (a as any).createdAt,
      };
    });

    return { items, total, page, limit };
  }

  async adminVerifyAccount(accountId: string, isVerified: boolean) {
    const account = await this.bankModel.findById(accountId);
    if (!account) {
      throw new BusinessException('Tài khoản ngân hàng không tồn tại', ErrorCodes.NOT_FOUND, HttpStatus.NOT_FOUND);
    }
    account.isVerified = isVerified;
    await account.save();
    return { message: isVerified ? 'Đã xác minh tài khoản ngân hàng' : 'Đã hủy xác minh tài khoản ngân hàng' };
  }

  async adminDeleteAccount(accountId: string) {
    const account = await this.bankModel.findByIdAndUpdate(accountId, { isActive: false });
    if (!account) {
      throw new BusinessException('Tài khoản ngân hàng không tồn tại', ErrorCodes.NOT_FOUND, HttpStatus.NOT_FOUND);
    }
    return { message: 'Đã xóa liên kết tài khoản ngân hàng' };
  }
}

