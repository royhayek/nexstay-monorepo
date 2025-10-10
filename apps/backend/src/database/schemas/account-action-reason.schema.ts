import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AccountActionReasonDocument = AccountActionReason & Document;

export enum AccountActionType {
  DEACTIVATION = 'deactivation',
  DELETION = 'deletion',
  SUSPENSION = 'suspension',
  RESTRICTION = 'restriction',
}

@Schema({ timestamps: true, collection: 'account_action_reasons' })
export class AccountActionReason {
  @Prop({
    required: true,
    trim: true,
    maxlength: 100,
  })
  title!: string;

  @Prop({
    required: false,
    trim: true,
    maxlength: 500,
  })
  description?: string;

  @Prop({
    required: true,
    enum: AccountActionType,
    index: true,
  })
  actionType!: AccountActionType;

  @Prop({
    default: true,
    index: true,
  })
  isActive!: boolean;

  @Prop({
    default: 0,
    min: 0,
  })
  sortOrder!: number;

  @Prop({
    default: false,
  })
  requiresAdminApproval!: boolean;

  @Prop({
    default: false,
  })
  isDefault!: boolean;

  createdAt!: Date;
  updatedAt!: Date;
}

export const AccountActionReasonSchema = SchemaFactory.createForClass(AccountActionReason);

// Indexes
AccountActionReasonSchema.index({ actionType: 1, isActive: 1, sortOrder: 1 });
AccountActionReasonSchema.index({ isDefault: 1, actionType: 1 });
