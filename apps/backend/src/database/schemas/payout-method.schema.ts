import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { CurrencyCode } from '../../common/enums/payment.enums';
import {
  PayoutMethodType,
  PayoutMethodStatus,
  PayoutProvider,
} from '../../common/enums/payout.enums';

export type PayoutMethodDocument = PayoutMethod & Document;

@Schema({ _id: false })
export class BankAccountDetails {
  @Prop({ required: true })
  accountNumber: string;

  @Prop({ required: true })
  routingNumber: string;

  @Prop({ required: true })
  accountHolderName: string;

  @Prop()
  bankName?: string;

  @Prop()
  swiftCode?: string;

  @Prop()
  iban?: string;
}

@Schema({ _id: false })
export class WalletDetails {
  @Prop({ required: true })
  walletAddress: string;

  @Prop({ required: true })
  walletType: string;
}

@Schema({ timestamps: true, collection: 'payout_methods' })
export class PayoutMethod {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true, type: String, enum: PayoutMethodType })
  type: PayoutMethodType;

  @Prop({
    required: true,
    type: String,
    enum: PayoutMethodStatus,
    default: PayoutMethodStatus.PENDING,
  })
  status: PayoutMethodStatus;

  @Prop({ type: BankAccountDetails })
  bankAccount?: BankAccountDetails;

  @Prop({ type: WalletDetails })
  wallet?: WalletDetails;

  @Prop({ required: true, type: String, enum: CurrencyCode })
  currency: CurrencyCode;

  @Prop({ type: String, enum: PayoutProvider })
  provider?: PayoutProvider;

  @Prop()
  nickname?: string;

  @Prop({ default: false })
  isDefault: boolean;

  @Prop({ type: Object, default: {} })
  verificationData: Record<string, any>;

  @Prop()
  verifiedAt?: Date;

  @Prop()
  lastUsedAt?: Date;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;

  createdAt: Date;
  updatedAt: Date;
}

export const PayoutMethodSchema = SchemaFactory.createForClass(PayoutMethod);

// Indexes
PayoutMethodSchema.index({ userId: 1, isDefault: -1 });
PayoutMethodSchema.index({ userId: 1, status: 1 });
PayoutMethodSchema.index({ status: 1, type: 1 });
PayoutMethodSchema.index({ provider: 1, status: 1 });
PayoutMethodSchema.index({ verifiedAt: 1 });
