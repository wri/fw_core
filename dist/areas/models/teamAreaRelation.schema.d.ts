import * as mongoose from "mongoose";
export interface ITeamAreaRelation {
    teamId: string;
    areaId: string;
}
export declare class TeamAreaRelation {
    teamId: string;
    areaId: string;
}
export interface TeamAreaRelationDocument extends ITeamAreaRelation, mongoose.Document {
}
export declare const TeamAreaRelationSchema: mongoose.Schema<TeamAreaRelation, mongoose.Model<TeamAreaRelation, any, any, any>, any, any>;
