import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { IGeostore } from '../../areas/models/geostore.entity';
import { AssignmentStatus } from '../assignment-status.enum';

export interface IAssignment {
  name: string;
  location?: { lat: number; lon: number; alertType?: string }[];
  geostore?: string | IGeostore;
  priority: number;
  monitors: string[];
  notes: string;
  status: string;
  areaId: string;
  templateIds: string[];
  createdAt: number;
  createdBy?: string;
  areaName?: string;
}

@Schema()
export class Assignment {
  @Prop({ required: true })
  name: string;

  @Prop({ required: false, type: Object })
  location: {
    lat: number;
    lon: number;
    alertType?: string;
  }[];

  @Prop({ required: false })
  geostore: mongoose.Schema.Types.Mixed;

  @Prop({ required: true })
  priority: number;

  @Prop({ required: true })
  monitors: string[];

  @Prop({ required: true })
  notes: string;

  @Prop({ type: String, enum: AssignmentStatus, required: true })
  status: AssignmentStatus;

  @Prop({ required: false })
  alert: string;

  @Prop({ required: true })
  areaId: string;

  @Prop({ required: true })
  templateIds: string[];

  @Prop({ required: false })
  areaName: string;

  @Prop({ required: true })
  createdBy: string;

  @Prop({ required: true, default: Date.now() })
  createdAt: Date;
}

export interface AssignmentDocument extends IAssignment, mongoose.Document {}

export interface IAssignmentResponse {
  data: any;
}

export const AssignmentSchema = SchemaFactory.createForClass(Assignment);
