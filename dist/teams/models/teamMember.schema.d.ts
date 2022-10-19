import * as mongoose from "mongoose";
export declare enum EMemberRole {
    Administrator = "administrator",
    Manager = "manager",
    Monitor = "monitor",
    Left = "left"
}
export declare enum EMemberStatus {
    Confirmed = "confirmed",
    Invited = "invited",
    Declined = "declined"
}
export interface ITeamMember {
    teamId: string;
    userId?: string;
    email: string;
    role: EMemberRole;
    status: EMemberStatus;
    name?: string;
}
export declare class TeamMember {
    teamId: string;
    userId: string;
    email: string;
    role: EMemberRole;
    status: EMemberStatus;
    name: string;
}
export interface TeamMemberDocument extends ITeamMember, mongoose.Document {
}
export declare const TeamMemberSchema: mongoose.Schema<TeamMember, mongoose.Model<TeamMember, any, any, any>, any, any>;
