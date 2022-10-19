import { Model } from 'mongoose';
import { TeamAreaRelationDocument } from "../models/teamAreaRelation.schema";
export declare class TeamAreaRelationService {
    private teamAreaRelationModel;
    constructor(teamAreaRelationModel: Model<TeamAreaRelationDocument>);
    create({ areaId, teamId }: {
        areaId: any;
        teamId: any;
    }): Promise<TeamAreaRelationDocument>;
    getAllTeamsForArea(areaId: string): Promise<string[]>;
    getAllAreasForTeam(teamId: string): Promise<string[]>;
    find(filter: any): Promise<TeamAreaRelationDocument[]>;
    delete(filter: any): Promise<void>;
}
