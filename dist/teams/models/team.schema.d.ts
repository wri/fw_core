import * as mongoose from "mongoose";
import { EMemberRole, TeamMemberDocument } from "./teamMember.schema";
export interface ITeam {
    name: string;
    userRole?: EMemberRole;
    createdAt: string;
    members?: TeamMemberDocument[];
    areas?: string[];
}
export declare class Team {
    name: string;
    createdAt: string;
}
export interface TeamDocument extends ITeam, mongoose.Document {
}
export interface ITeamResponse {
    data: TeamDocument | TeamDocument[];
}
export declare const TeamSchema: mongoose.Schema<Team, mongoose.Model<Team, any, any, any>, any, any>;
