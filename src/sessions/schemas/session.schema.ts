import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type SessionDocument = HydratedDocument<Session>;

export interface Turn {
  role: 'user' | 'model';
  text: string;
}

@Schema({ timestamps: true })
export class Session {
  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ type: [{ role: String, text: String }], default: [] })
  history: Turn[];

  @Prop({ required: true })
  lastActiveAt: Date;

  @Prop({ default: false })
  archived: boolean;
}

export const SessionSchema = SchemaFactory.createForClass(Session);
