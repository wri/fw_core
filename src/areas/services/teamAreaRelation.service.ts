import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from 'mongoose';
import { TeamAreaRelation, TeamAreaRelationDocument } from "../models/teamAreaRelation.schema";

@Injectable()
export class TeamAreaRelationService {

    constructor(
        @InjectModel(TeamAreaRelation.name) private teamAreaRelationModel: Model<TeamAreaRelationDocument>
        ) { }

    async create({areaId, teamId}): Promise<TeamAreaRelationDocument> {
        if(await this.teamAreaRelationModel.findOne({areaId, teamId})) throw new HttpException("Relation already exists", HttpStatus.BAD_REQUEST);
        const newRelation = new this.teamAreaRelationModel({areaId, teamId});
        return await newRelation.save();
    }

    async getAllTeamsForArea(areaId: string): Promise<string[]> {
        const relations: TeamAreaRelationDocument[] = await this.teamAreaRelationModel.find({areaId});
        return relations.map(relation => relation.teamId);
    }

    async getAllAreasForTeam(teamId: string): Promise<string[]> {
        const relations: TeamAreaRelationDocument[] = await this.teamAreaRelationModel.find({teamId});
        return relations.map(relation => relation.areaId);
    }

    async find(filter): Promise<TeamAreaRelationDocument[]> {
        return await this.teamAreaRelationModel.find(filter);
    }

    delete(filter): void {
        this.teamAreaRelationModel.deleteMany(filter)
    }
}