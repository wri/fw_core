import { UpdateAnswerDto } from '../dto/update-answer.dto';
import { AnswerDocument, IAnswer } from '../models/answer.model';
import { Model } from 'mongoose';
import { IUser } from '../../common/user.model';
import { TeamDocument } from '../../teams/models/team.schema';
import { TeamMembersService } from '../../teams/services/teamMembers.service';
import { UserService } from '../../common/user.service';
import { TemplateDocument } from '../../templates/models/template.schema';
import { TeamsService } from '../../teams/services/teams.service';
import { TeamAreaRelationService } from '../../areas/services/teamAreaRelation.service';
export declare class AnswersService {
    private templateModel;
    private answerModel;
    private readonly teamMembersService;
    private readonly teamsService;
    private readonly teamAreaRelationService;
    private readonly userService;
    constructor(templateModel: Model<TemplateDocument>, answerModel: Model<AnswerDocument>, teamMembersService: TeamMembersService, teamsService: TeamsService, teamAreaRelationService: TeamAreaRelationService, userService: UserService);
    create(answer: IAnswer): Promise<IAnswer>;
    getAllTemplateAnswers({ template, user }: {
        template: TemplateDocument;
        user: IUser;
    }): Promise<IAnswer[]>;
    getAllAnswers({ loggedUser, teams }: {
        loggedUser: IUser;
        teams: TeamDocument[];
    }): Promise<IAnswer[]>;
    filterAnswersByArea({ reportId, teams, areaId, loggedUser, restricted }: {
        reportId: string;
        teams: TeamDocument[];
        areaId: string;
        loggedUser: IUser;
        restricted: boolean;
    }): Promise<IAnswer[]>;
    findSome(filter: any): Promise<(AnswerDocument & {
        _id: any;
    })[]>;
    findOne(filter: any): Promise<AnswerDocument & {
        _id: any;
    }>;
    update(id: number, updateAnswerDto: UpdateAnswerDto): string;
    delete(filter: any): Promise<void>;
    addUsernameToAnswer(answer: AnswerDocument): Promise<AnswerDocument>;
    addUsernameToAnswers(answers: AnswerDocument[]): Promise<AnswerDocument[]>;
}
