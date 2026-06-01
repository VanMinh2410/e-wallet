import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TransactionDocument = Transaction & Document;

export enum TransactionType {
  TRANSFER = 'TRANSFER',
  DEPOSIT = 'DEPOSIT',
  WITHDRAW = 'WITHDRAW',
  BANK_TRANSFER = 'BANK_TRANSFER',
  PAYMENT = 'PAYMENT',
  REFUND = 'REFUND',
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

@Schema({ timestamps: true, collection: 'transactions' })
export class Transaction {
  @Prop({ required: true, unique: true })
  reference: string;

  @Prop({ enum: TransactionType, required: true })
  type: TransactionType;

  @Prop({ enum: TransactionStatus, default: TransactionStatus.PENDING })
  status: TransactionStatus;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Wallet' })
  fromWalletId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Wallet' })
  toWalletId?: Types.ObjectId;

  @Prop({ required: true, min: 1 })
  amount: number;

  @Prop({ default: 0, min: 0 })
  fee: number;

  @Prop()
  description?: string;

  @Prop({ type: Object })
  metadata?: Record<string, unknown>;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);

TransactionSchema.index({ userId: 1, createdAt: -1 });
TransactionSchema.index({ status: 1, type: 1, createdAt: -1 });
