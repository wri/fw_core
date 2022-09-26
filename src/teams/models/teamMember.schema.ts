import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose"
import * as mongoose from "mongoose";
import { Team } from "./team.schema";

export enum EMemberRole {
    Administrator = "administrator",
    Manager = "manager",
    Monitor = "monitor",
    Left = "left"
}

export enum EMemberStatus {
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

@Schema()
export class TeamMember {

    @Prop({ required: true })
    teamId: string;

    @Prop()
    userId: string;

    @Prop({ required: true })
    email: string

    @Prop({ required: true })
    role: EMemberRole

    @Prop({ required: true })
    status: EMemberStatus

    @Prop()
    name: string
}

export interface TeamMemberDocument extends ITeamMember, mongoose.Document {}

export const TeamMemberSchema = SchemaFactory.createForClass(TeamMember);