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
export declare class Answer {
    report: string;
    reportName: string;
    templateName: string;
    fullName: string;
    username: string;
    teamId: string;
    areaOfInterestName: string;
    areaOfInterest: string;
    language: string;
    userPosition: [];
    clickedPosition: [];
    user: string;
    responses: [IAnswerResponse];
    createdAt: Date;
}
export interface AnswerDocument extends IAnswer, mongoose.Document {
}
export interface IAnswerReturn {
    data: any;
}
export declare const AnswerSchema: mongoose.Schema<Answer, mongoose.Model<Answer, any, any, any>, any, any>;
