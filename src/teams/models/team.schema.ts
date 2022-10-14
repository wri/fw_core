import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose"
import * as mongoose from "mongoose";
import { EMemberRole, TeamMemberDocument } from "./teamMember.schema";

export interface ITeam {
    name: string;
    userRole?: EMemberRole;
    createdAt: string;
    members?: TeamMemberDocument[];
    areas?: string[];
  }

@Schema({collection: 'GFWTeam'})
export class Team {
    @Prop({required: false, trim: true})
    name: string;

    @Prop({required: true, default: Date.now})
    createdAt: string;
}

export interface TeamDocument extends ITeam, mongoose.Document {}

export interface ITeamResponse {
  data: TeamDocument | TeamDocument[]
}

export const TeamSchema = SchemaFactory.createForClass(Team);