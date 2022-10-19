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
}
export declare class Assignment {
    name: string;
    location: mongoose.Schema.Types.Mixed;
    priority: number;
    monitors: string[];
    notes: string;
    status: string;
    alert: string;
    areaId: string;
    templateId: string;
    teamIds: string[];
    createdBy: string;
    createdAt: Date;
}
export interface AssignmentDocument extends IAssignment, mongoose.Document {
}
export interface IAssignmentResponse {
    data: any;
}
export declare const AssignmentSchema: mongoose.Schema<Assignment, mongoose.Model<Assignment, any, any, any>, any, any>;
