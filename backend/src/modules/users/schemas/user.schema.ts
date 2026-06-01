import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true, collection: 'users' })
export class User {
  @Prop({ required: true })
  fullName: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true, unique: true })
  phone: string;

  @Prop({ required: true, select: false })
  passwordHash: string;

  @Prop({ default: false })
  isVerified: boolean;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ enum: ['user', 'admin'], default: 'user' })
  role: string;

  @Prop({ enum: ['none', 'pending', 'approved', 'rejected'], default: 'none' })
  kycStatus: string;
}

export const UserSchema = SchemaFactory.createForClass(User);