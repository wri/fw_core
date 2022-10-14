import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose"
import * as mongoose from "mongoose";
import { IGeojson } from "../../areas/models/area.entity";

export interface IAssignment {
name: string;
location: IGeojson;
priority: number;
monitors: string[];
notes: string;
status: string;
alert: string;
areaId: string;
templateId: string;
teamIds: string[];
createdAt: Date;
createdBy?: string;
areaName?: string;
}

@Schema()
export class Assignment {


    @Prop({required: true})
    name: string;

    @Prop({required: true})
    location: mongoose.Schema.Types.Mixed;

    @Prop({required: true})
    priority: number;

    @Prop({required: true})
    monitors: string[];

    @Prop({required: true})
    notes: string;

    @Prop({required: true})
    status: string;

    @Prop({required: true})
    alert: string;

    @Prop({required: true})
    areaId: string;

    @Prop({required: true})
    templateId: string;
    
    @Prop({required: true})
    teamIds: string[];

    @Prop({required: false})
    areaName: string;

    @Prop({required: true})
    createdBy: string;

    @Prop({required: true, default: Date.now()})
    createdAt: Date;

}

export interface AssignmentDocument extends IAssignment, mongoose.Document {}

export interface IAssignmentResponse {
  data: any
}

export const AssignmentSchema = SchemaFactory.createForClass(Assignment);