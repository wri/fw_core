import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { EMemberRole, TeamMemberDocument } from './teamMember.schema';

export interface ITeam {
  name: string;
  userRole?: EMemberRole;
  createdAt: string;
  members?: TeamMemberDocument[];
  areas?: string[];
  layers?: string[];
}

@Schema()
export class Team {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, default: Date.now })
  createdAt: string;

  @Prop({ required: false })
  userRole: string;

  @Prop({ required: false })
  members: mongoose.Schema.Types.Mixed;

  @Prop({ required: false })
  areas: string[];

  @Prop({ required: true, default: [] })
  layers: string[];
}

export interface TeamDocument extends ITeam, mongoose.Document {}

export interface ITeamResponse {
  data: TeamDocument | TeamDocument[];
}

export const TeamSchema = SchemaFactory.createForClass(Team);
