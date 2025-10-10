import { Prop } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export abstract class BaseCatalog extends Document {
  @Prop({ required: true, unique: true, uppercase: true, immutable: true })
  key: string;

  @Prop({ required: true, unique: true })
  slug: string;

  @Prop({ type: Object, required: true })
  name: Record<string, string>;

  @Prop({ type: Object })
  description?: Record<string, string>;

  @Prop()
  group?: string;

  @Prop()
  icon?: string;

  @Prop({ default: 0 })
  sortOrder: number;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isDeprecated: boolean;

  @Prop()
  deletedAt?: Date;

  @Prop()
  createdBy?: string;

  @Prop()
  updatedBy?: string;

  // Timestamps (automatically added by Mongoose when timestamps: true)
  createdAt: Date;
  updatedAt: Date;
}
