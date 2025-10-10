import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import type { SystemEnumName, SystemEnumValue } from '../../common/enums/system.enums';

export type EnumDisplayDocument = EnumDisplay & Document;

@Schema({ timestamps: true, collection: 'enum_displays' })
export class EnumDisplay extends Document {
  @Prop({ required: true, index: true, type: String })
  enumName: SystemEnumName;

  @Prop({ required: true, type: String })
  key: SystemEnumValue;

  @Prop({ type: Object })
  label?: Record<string, string>;

  @Prop({ default: 0 })
  sortOrder?: number;

  @Prop({ default: true })
  isVisible?: boolean;

  @Prop()
  createdBy?: string;

  @Prop()
  updatedBy?: string;

  // Timestamps (automatically added by Mongoose when timestamps: true)
  createdAt: Date;
  updatedAt: Date;
}

export const EnumDisplaySchema = SchemaFactory.createForClass(EnumDisplay);

// Create compound unique index on enumName + key
EnumDisplaySchema.index({ enumName: 1, key: 1 }, { unique: true });
