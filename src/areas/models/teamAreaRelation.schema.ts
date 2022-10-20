import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';

export interface ITeamAreaRelation {
  teamId: string;
  areaId: string;
}

@Schema()
export class TeamAreaRelation {
  @Prop({ required: true })
  teamId: string;

  @Prop({ required: true })
  areaId: string;
}

export interface TeamAreaRelationDocument
  extends ITeamAreaRelation,
    mongoose.Document {}

export const TeamAreaRelationSchema =
  SchemaFactory.createForClass(TeamAreaRelation);
