import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose"
import * as mongoose from "mongoose";

export interface IAnswerResponse {
    name: string;
    value?: string;
}

export interface IAnswer {
    report: string;
    reportName: string;
    templateName?: string;
    fullName?: string;
    username?: string;
    organization?: string;
    teamId?: string;
    areaOfInterest?: string;
    areaOfInterestName?: string;
    language: string;
    userPosition?: any[];
    clickedPosition?: any[];
    user: string;
    responses: IAnswerResponse[];
    createdAt: string;
  }

@Schema()
export class Answer {
    @Prop({required: true})
    report: string; // template ID

    @Prop({required: true})
    reportName: string; // report answer name

    @Prop({required: false})
    templateName: string;

    @Prop({required: false, trim: true})
    fullName: string; // name of monitor making report

    @Prop({required: false, trim: true})
    username: string;

    @Prop({required: false})
    teamId: string;
    
    @Prop({required: false})
    areaOfInterestName: string;

    @Prop({required: false})
    areaOfInterest: string;

    @Prop({required: true})
    language: string; 

    @Prop({required: false, default: []})
    userPosition: [];

    @Prop({required: false, default: []})
    clickedPosition: [];

    @Prop({required: true})
    user: string;

    @Prop()
    responses: [IAnswerResponse];

    @Prop({required: true, default: Date.now()})
    createdAt: Date;

}

export interface AnswerDocument extends IAnswer, mongoose.Document {}

export interface IAnswerReturn {
  data: any
}

export const AnswerSchema = SchemaFactory.createForClass(Answer);