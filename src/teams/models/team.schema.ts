import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { EMemberRole, TeamMemberDocument } from './teamMember.schema';

export interface ITeam {
  name: string;
  userRole?: EMemberRole;
  createdAt: string;
  members?: TeamMemberDocument[];
  areas?: string[];
}

@Schema()
export class Team {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, default: Date.now })
  createdAt: string;

  @Prop({ required: false, default: Date.now })
  userRole: string;

  @Prop({ required: false, default: Date.now })
  members: mongoose.Schema.Types.Mixed;

  @Prop({ required: false, default: Date.now })
  areas: string[];
}

export interface TeamDocument extends ITeam, mongoose.Document {}

export interface ITeamResponse {
  data: TeamDocument | TeamDocument[];
}

export const TeamSchema = SchemaFactory.createForClass(Team);
