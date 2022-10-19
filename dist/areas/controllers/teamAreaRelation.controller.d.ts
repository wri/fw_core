import { AreasService } from '../services/areas.service';
import { CreateTeamAreaRelationDto } from '../dto/createTeamAreaRelation.dto';
import { TeamsService } from '../../teams/services/teams.service';
import { TeamAreaRelationService } from '../services/teamAreaRelation.service';
import { TeamAreaRelationDocument } from '../models/teamAreaRelation.schema';
export declare class TeamAreaRelationController {
    private readonly areasService;
    private readonly teamsService;
    private readonly teamAreaRelationService;
    constructor(areasService: AreasService, teamsService: TeamsService, teamAreaRelationService: TeamAreaRelationService);
    private readonly logger;
    createTeamAreaRelation(body: CreateTeamAreaRelationDto): Promise<TeamAreaRelationDocument>;
    deleteTeamAreaRelation(body: CreateTeamAreaRelationDto): Promise<void>;
    getAllTeamsForArea(areaId: string): Promise<string[]>;
    getAllAreasForTeam(teamId: string): Promise<string[]>;
    deleteOneRelation(teamId: string, areaId: string): void;
    deleteAllTeamRelations(teamId: string): void;
    deleteAllAreaRelations(areaId: string): void;
}
