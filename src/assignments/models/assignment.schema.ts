import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { TemplateDocument } from '../../templates/models/template.schema';
import { IGeostore } from '../../areas/models/geostore.entity';
import { AssignmentStatus } from '../assignment-status.enum';

export interface IAssignment {
  name: string;
  location?: {
    lat: number;
    lon: number;
    alertType?: string;
    alertId?: string;
  }[];
  geostore?: string | IGeostore;
  priority: number;
  monitors: string[];
  notes?: string;
  image?: string;
  status: string;
  areaId: string;
  templateIds: string[];
  createdAt: number;
  createdBy?: string;
  areaName?: string;
  monitorNames?: { id: string; name: string }[];
  templates?: (TemplateDocument | null)[];
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
    alertId?: string;
  }[];

  @Prop({ required: false })
  geostore: mongoose.Schema.Types.Mixed;

  @Prop({ required: true })
  priority: number;

  @Prop({ required: true })
  monitors: string[];

  @Prop({ required: false })
  notes: string;

  @Prop({ required: false })
  image?: string;

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

  @Prop({ required: false })
  monitorNames?: mongoose.Schema.Types.Mixed;

  @Prop({ required: false })
  templates?: mongoose.Schema.Types.Mixed;
}

export interface AssignmentDocument extends IAssignment, mongoose.Document {}

export interface IAssignmentResponse {
  data: any;
}

export const AssignmentSchema = SchemaFactory.createForClass(Assignment);
