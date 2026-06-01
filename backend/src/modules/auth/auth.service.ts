import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Connection, Model } from 'mongoose';
import { createCipheriv, randomBytes, scryptSync } from 'crypto';
import { BusinessException } from '../../common/exceptions/business.exception';
import { ErrorCodes } from '../../common/constants/error-codes';
import { RedisService } from '../../common/redis/redis.service';
import { MailerService } from '../../common/mailer/mailer.service';
import { Wallet, WalletDocument } from '../wallets/schemas/wallet.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { OtpRecord, OtpRecordDocument } from './schemas/otp-record.schema';
import { BankAccount, BankAccountDocument } from '../bank/schemas/bank-account.schema';
import { RegisterDto } from './dto/register.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

const SALT_ROUNDS = 12;
const RT_TTL = 7 * 24 * 60 * 60;
const TX_OTP_REDIS_TTL = 300;

export const TX_OTP_THRESHOLD = 5_000_000;

type OtpSendResult = { message: string; devOtp?: string; emailSent?: boolean };

@Injectable()
export class AuthService {
  private readonly key = scryptSync(process.env.COOKIE_SECRET || 'dev-key', 'salt', 32);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Wallet.name) private walletModel: Model<WalletDocument>,
    @InjectModel(OtpRecord.name) private otpModel: Model<OtpRecordDocument>,
    @InjectModel(BankAccount.name) private bankModel: Model<BankAccountDocument>,
    @InjectConnection() private connection: Connection,
    private jwtService: JwtService,
    private configService: ConfigService,
    private redisService: RedisService,
    private mailerService: MailerService,
  ) {}

  private encrypt(text: string): string {
    const iv = randomBytes(16);
    const cipher = createCipheriv('aes-256-ctr', this.key, iv);
    const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
    return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
  }

  async validateUser(email: string, password: string): Promise<UserDocument | null> {
    const user = await this.userModel.findOne({ email: email.toLowerCase() }).select('+passwordHash');
    if (!user || !user.isActive) return null;
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return null;
    return user;
  }

  async register(dto: RegisterDto): Promise<OtpSendResult> {
    const email = dto.email.toLowerCase();
    const existing = await this.userModel.findOne({
      $or: [{ email }, { phone: dto.phone }],
    });
    if (existing) {
      if (existing.email === email) {
        throw new BusinessException('Email đã được sử dụng', ErrorCodes.DUPLICATE_EMAIL, HttpStatus.CONFLICT);
      }
      throw new BusinessException('Số điện thoại đã được sử dụng', ErrorCodes.DUPLICATE_PHONE, HttpStatus.CONFLICT);
    }

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      const [user] = await this.userModel.create(
        [{ fullName: dto.fullName, email, phone: dto.phone, passwordHash, isVerified: false }],
        { session },
      );
      await this.walletModel.create([{ userId: user._id, balance: 0 }], { session });
      
      // Auto link a default card for the newly registered user
      await this.bankModel.create(
        [
          {
            userId: user._id,
            bankCode: 'VCB',
            bankName: 'Vietcombank',
            accountNumber: this.encrypt('0123456789'),
            accountName: dto.fullName.toUpperCase(),
            isVerified: true,
            isActive: true,
          },
        ],
        { session },
      );

      await session.commitTransaction();
      const otp = await this.sendOtp(user, 'email_verify');
      return {
        message: 'Đăng ký thành công. Vui lòng xác minh email bằng mã OTP.',
        emailSent: otp.emailSent,
        devOtp: otp.devOtp,
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const user = await this.userModel.findOne({ email: dto.email.toLowerCase() });
    if (!user) throw new BusinessException('Người dùng không tồn tại', ErrorCodes.NOT_FOUND, HttpStatus.NOT_FOUND);

    const otp = await this.otpModel.findOne({
      userId: user._id,
      code: dto.code,
      type: 'email_verify',
      used: false,
      expiresAt: { $gt: new Date() },
    });
    if (!otp) {
      throw new BusinessException('Mã OTP không hợp lệ hoặc đã hết hạn', ErrorCodes.INVALID_OTP);
    }

    otp.used = true;
    await otp.save();
    user.isVerified = true;
    await user.save();
    return { message: 'Xác minh email thành công' };
  }

  async resendOtp(email: string): Promise<OtpSendResult> {
    const user = await this.userModel.findOne({ email: email.toLowerCase() });
    if (!user) throw new BusinessException('Người dùng không tồn tại', ErrorCodes.NOT_FOUND, HttpStatus.NOT_FOUND);
    const otp = await this.sendOtp(user, 'email_verify');
    return {
      message: 'Mã OTP mới đã được gửi tới email của bạn',
      emailSent: otp.emailSent,
      devOtp: otp.devOtp,
    };
  }

  async sendTransactionOtp(userId: string): Promise<OtpSendResult> {
    const user = await this.userModel.findById(userId);
    if (!user) throw new BusinessException('Người dùng không tồn tại', ErrorCodes.NOT_FOUND, HttpStatus.NOT_FOUND);
    const otp = await this.sendOtp(user, 'transaction');
    return {
      message: 'Mã OTP giao dịch đã được gửi tới email của bạn',
      emailSent: otp.emailSent,
      devOtp: otp.devOtp,
    };
  }

  async verifyTransactionOtp(userId: string, code: string) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new BusinessException('Người dùng không tồn tại', ErrorCodes.NOT_FOUND, HttpStatus.NOT_FOUND);

    const otp = await this.otpModel.findOne({
      userId: user._id,
      code,
      type: 'transaction',
      used: false,
      expiresAt: { $gt: new Date() },
    });
    if (!otp) {
      throw new BusinessException('Mã OTP không hợp lệ hoặc đã hết hạn', ErrorCodes.INVALID_OTP);
    }

    otp.used = true;
    await otp.save();
    await this.redisService.set(`txotp:${userId}`, '1', TX_OTP_REDIS_TTL);
    return { message: 'Xác thực OTP giao dịch thành công', expiresInSeconds: TX_OTP_REDIS_TTL };
  }

  async assertTransactionOtp(userId: string, amount: number, threshold = TX_OTP_THRESHOLD, otpCode?: string) {
    if (otpCode) {
      await this.verifyTransactionOtp(userId, otpCode);
      return;
    }

    if (amount >= threshold) {
      const verified = await this.redisService.get(`txotp:${userId}`);
      if (!verified) {
        throw new BusinessException(
          `Giao dịch từ ${threshold.toLocaleString('vi-VN')}đ cần xác thực OTP. Vui lòng gửi và nhập mã OTP.`,
          ErrorCodes.INVALID_OTP,
        );
      }
      await this.redisService.del(`txotp:${userId}`);
    }
  }

  async login(user: UserDocument) {
    if (!user.isVerified) {
      throw new BusinessException('Vui lòng xác minh email trước khi đăng nhập', ErrorCodes.USER_NOT_VERIFIED, HttpStatus.FORBIDDEN);
    }
    return this.issueTokens(user);
  }

  async verifyRefreshToken(refreshToken: string): Promise<{ sub: string }> {
    try {
      return this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET') || 'dev-refresh-secret',
      }) as { sub: string };
    } catch {
      throw new BusinessException('Refresh token không hợp lệ', ErrorCodes.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
    }
  }

  async refreshTokens(userId: string, refreshToken: string) {
    const storedHash = await this.redisService.get(`rt:${userId}`);
    if (!storedHash) {
      throw new BusinessException('Phiên đăng nhập không hợp lệ', ErrorCodes.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
    }
    const valid = await bcrypt.compare(refreshToken, storedHash);
    if (!valid) {
      throw new BusinessException('Phiên đăng nhập không hợp lệ', ErrorCodes.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
    }
    const user = await this.userModel.findById(userId);
    if (!user || !user.isActive) {
      throw new BusinessException('Người dùng không tồn tại', ErrorCodes.NOT_FOUND, HttpStatus.NOT_FOUND);
    }
    return this.issueTokens(user);
  }

  async logout(userId: string) {
    await this.redisService.del(`rt:${userId}`);
    return { message: 'Đăng xuất thành công' };
  }

  async forgotPassword(email: string): Promise<OtpSendResult> {
    const user = await this.userModel.findOne({ email: email.toLowerCase() });
    if (!user) return { message: 'Nếu email tồn tại, mã OTP đã được gửi' };
    const otp = await this.sendOtp(user, 'password_reset');
    return {
      message: 'Nếu email tồn tại, mã OTP đã được gửi',
      emailSent: otp.emailSent,
      devOtp: otp.devOtp,
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.userModel.findOne({ email: dto.email.toLowerCase() });
    if (!user) throw new BusinessException('Người dùng không tồn tại', ErrorCodes.NOT_FOUND, HttpStatus.NOT_FOUND);

    const otp = await this.otpModel.findOne({
      userId: user._id,
      code: dto.code,
      type: 'password_reset',
      used: false,
      expiresAt: { $gt: new Date() },
    });
    if (!otp) throw new BusinessException('Mã OTP không hợp lệ', ErrorCodes.INVALID_OTP);

    otp.used = true;
    await otp.save();
    user.passwordHash = await bcrypt.hash(dto.newPassword, SALT_ROUNDS);
    await user.save();
    await this.redisService.del(`rt:${user._id}`);
    return { message: 'Đặt lại mật khẩu thành công' };
  }

  private async issueTokens(user: UserDocument) {
    const payload = { sub: user._id.toString(), email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_ACCESS_SECRET') || 'dev-access-secret',
      expiresIn: this.configService.get('JWT_ACCESS_EXPIRES') || '15m',
    });
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET') || 'dev-refresh-secret',
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRES') || '7d',
    });
    const hashedRT = await bcrypt.hash(refreshToken, 10);
    await this.redisService.set(`rt:${user._id}`, hashedRT, RT_TTL);
    return { accessToken, refreshToken, user: this.sanitizeUser(user) };
  }

  private sanitizeUser(user: UserDocument) {
    return {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isVerified: user.isVerified,
      kycStatus: user.kycStatus,
    };
  }

  private async sendOtp(
    user: UserDocument,
    type: string,
  ): Promise<{ emailSent: boolean; devOtp?: string }> {
    await this.otpModel.updateMany({ userId: user._id, type, used: false }, { $set: { used: true } });

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await this.otpModel.create({ userId: user._id, code, type, expiresAt });

    const purpose =
      type === 'password_reset'
        ? 'password_reset'
        : type === 'transaction'
          ? 'transaction'
          : 'email_verify';

    const result = await this.mailerService.sendOtpEmail({
      to: user.email,
      code,
      purpose,
    });

    const isDev = this.configService.get('NODE_ENV') !== 'production';
    const emailHost = this.configService.get<string>('EMAIL_HOST');

    if (!result.sent && emailHost) {
      throw new BusinessException(
        'Không thể gửi email OTP. Vui lòng kiểm tra lại cấu hình Email/SMTP trong tệp .env.',
        ErrorCodes.INTERNAL_SERVER_ERROR,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    if (!result.sent) {
      // eslint-disable-next-line no-console
      console.log(`[OTP] ${user.email} (${type}): ${code}`);
      if (isDev) {
        return { emailSent: false, devOtp: code };
      }
    }

    return { emailSent: result.sent };
  }
}
