import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type OtpRecordDocument = OtpRecord & Document;

@Schema({ timestamps: true, collection: 'otp_records' })
export class OtpRecord {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  code: string;

  @Prop({ enum: ['email_verify', 'login', 'password_reset', 'transaction'], required: true })
  type: string;

  @Prop({ required: true })
  expiresAt: Date;

  @Prop({ default: false })
  used: boolean;
}

export const OtpRecordSchema = SchemaFactory.createForClass(OtpRecord);
OtpRecordSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
