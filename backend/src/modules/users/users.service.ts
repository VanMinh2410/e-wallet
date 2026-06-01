import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Model } from 'mongoose';
import { BusinessException } from '../../common/exceptions/business.exception';
import { ErrorCodes } from '../../common/constants/error-codes';
import { RedisService } from '../../common/redis/redis.service';
import { User, UserDocument } from './schemas/user.schema';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private redisService: RedisService,
  ) {}

  async getProfile(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new BusinessException('Người dùng không tồn tại', ErrorCodes.NOT_FOUND, HttpStatus.NOT_FOUND);
    return {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      kycStatus: user.kycStatus,
      isVerified: user.isVerified,
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.userModel.findByIdAndUpdate(userId, dto, { new: true });
    if (!user) throw new BusinessException('Người dùng không tồn tại', ErrorCodes.NOT_FOUND, HttpStatus.NOT_FOUND);
    return this.getProfile(userId);
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.userModel.findById(userId).select('+passwordHash');
    if (!user) throw new BusinessException('Người dùng không tồn tại', ErrorCodes.NOT_FOUND, HttpStatus.NOT_FOUND);
    const valid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!valid) throw new BusinessException('Mật khẩu hiện tại không đúng', ErrorCodes.INVALID_CREDENTIALS);
    user.passwordHash = await bcrypt.hash(dto.newPassword, 12);
    await user.save();
    await this.redisService.del(`rt:${userId}`);
    return { message: 'Đổi mật khẩu thành công. Vui lòng đăng nhập lại.' };
  }

  async submitKyc(userId: string, documents: Record<string, string>) {
    await this.userModel.findByIdAndUpdate(userId, { kycStatus: 'pending' });
    return { message: 'Đã gửi hồ sơ KYC', documents };
  }

  async getKycStatus(userId: string) {
    const user = await this.userModel.findById(userId);
    return { kycStatus: user?.kycStatus ?? 'none' };
  }
}
