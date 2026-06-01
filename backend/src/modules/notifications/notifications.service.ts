import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Notification, NotificationDocument } from './schemas/notification.schema';
import { NotificationGateway } from '../../gateways/notification.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name) private notificationModel: Model<NotificationDocument>,
    private notificationGateway: NotificationGateway,
  ) {}

  async create(userId: string, title: string, message: string, type?: string, data?: Record<string, unknown>) {
    const notification = await this.notificationModel.create({
      userId: new Types.ObjectId(userId),
      title,
      message,
      type,
      data,
    });
    const payload = {
      id: notification._id,
      title,
      message,
      type,
      createdAt: (notification as NotificationDocument & { createdAt?: Date }).createdAt,
    };
    this.notificationGateway.emitNotification(userId, payload);
    return notification;
  }

  async findByUser(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.notificationModel
        .find({ userId: new Types.ObjectId(userId) })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.notificationModel.countDocuments({ userId: new Types.ObjectId(userId) }),
    ]);
    return { items, total, page, limit };
  }

  async markRead(userId: string, id: string) {
    return this.notificationModel.findOneAndUpdate(
      { _id: id, userId: new Types.ObjectId(userId) },
      { isRead: true },
      { new: true },
    );
  }

  async markAllRead(userId: string) {
    await this.notificationModel.updateMany(
      { userId: new Types.ObjectId(userId), isRead: false },
      { isRead: true },
    );
    return { message: 'Đã đánh dấu tất cả đã đọc' };
  }
}
