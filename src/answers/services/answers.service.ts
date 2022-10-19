import { Injectable } from '@nestjs/common';
import { CreateAnswerDto } from '../dto/create-answer.dto';
import { UpdateAnswerDto } from '../dto/update-answer.dto';
import {
  Answer,
  AnswerDocument,
  IAnswer,
  IAnswerResponse,
} from '../models/answer.model';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { IUser } from '../../common/user.model';
import { TeamDocument } from '../../teams/models/team.schema';
import { EMemberRole } from '../../teams/models/teamMember.schema';
import { TeamMembersService } from '../../teams/services/teamMembers.service';
import mongoose from 'mongoose';
import { UserService } from '../../common/user.service';
import {
  Template,
  TemplateDocument,
} from '../../templates/models/template.schema';
import { TeamsService } from '../../teams/services/teams.service';
import { TeamAreaRelationService } from '../../areas/services/teamAreaRelation.service';

@Injectable()
export class AnswersService {
  constructor(
    @InjectModel('reports', 'formsDb')
    private templateModel: Model<TemplateDocument>,
    @InjectModel(Answer.name, 'formsDb')
    private answerModel: Model<AnswerDocument>,
    private readonly teamMembersService: TeamMembersService,
    private readonly teamsService: TeamsService,
    private readonly teamAreaRelationService: TeamAreaRelationService,
    private readonly userService: UserService,
  ) {}

  async create(answer: IAnswer): Promise<IAnswer> {
    const answerToSave = new this.answerModel(answer);
    const savedAnswer = await answerToSave.save();
    return await this.addUsernameToAnswer(savedAnswer);
  }

  async getAllTemplateAnswers({
    template,
    user,
  }: {
    template: TemplateDocument;
    user: IUser;
  }): Promise<IAnswer[]> {
    let filter = {};
    const confirmedUsers = [];
    // add current user to users array
    confirmedUsers.push(user.id);

    const teamsManaged = await this.teamsService.findAllManagedTeams(user.id);
    // get all managed teams users
    for await (const team of teamsManaged) {
      // get users of each team
      const users = await this.teamMembersService.findAllTeamMembers(
        team,
        EMemberRole.Administrator,
      );
      confirmedUsers.push(...users.map((user) => user.userId));
    }

    // Admin users and owners of the report template can check all report answers
    if (
      user.role === 'ADMIN' ||
      user.id.toString() === template.user.toString()
    ) {
      filter = {
        $and: [{ report: template._id }],
      };
    } else if (teamsManaged.length > 0) {
      // managers can check all report answers from the default template (the only public template) from him and his team's members
      filter = {
        $and: [{ report: template._id }, { user: { $in: confirmedUsers } }],
      };
    } else {
      // monitors can see their own answers
      filter = {
        $and: [
          { report: template._id },
          { user: new mongoose.Types.ObjectId(user.id) },
        ],
      };
    }
    return await this.addUsernameToAnswers(await this.answerModel.find(filter));
  }

  async getAllAnswers({
    loggedUser,
    teams,
  }: {
    loggedUser: IUser;
    teams: TeamDocument[];
  }): Promise<IAnswer[]> {
    let filter = {};
    let teamsManaged = [];
    const confirmedUsers = [];
    if (teams.length > 0) {
      // check if user is manager of any teams
      teamsManaged = teams.filter(
        (team) =>
          team.userRole === EMemberRole.Manager ||
          team.userRole === EMemberRole.Administrator,
      );
      // get all managed teams users
      if (teamsManaged.length > 0) {
        for await (const team of teamsManaged) {
          // get users of each team and add to users array
          const teamUsers = await this.teamMembersService.findAllTeamMembers(
            team.id,
            EMemberRole.Administrator,
          );
          if (teamUsers)
            confirmedUsers.push(
              ...teamUsers.map((teamUser) => teamUser.userId),
            );
        }
      }
    }
    // add current user to users array
    confirmedUsers.push(new mongoose.Types.ObjectId(loggedUser.id));

    filter = { user: { $in: confirmedUsers } };

    const answers = await this.answerModel.find(filter);

    return await this.addUsernameToAnswers(answers);
  }

  async filterAnswersByArea({
    reportId,
    teams,
    areaId,
    loggedUser,
    restricted,
  }: {
    reportId: string;
    teams: TeamDocument[];
    areaId: string;
    loggedUser: IUser;
    restricted: boolean;
  }): Promise<IAnswer[]> {
    // monitors can see reports from their team members in this area

    // get all area teams
    const areaTeamsRelations = await this.teamAreaRelationService.find({
      areaId,
    });
    const areaTeams = areaTeamsRelations.map((relation) =>
      relation.teamId.toString(),
    );
    // filter area teams by user teams
    const filteredTeams = teams.filter((team) =>
      areaTeams.includes(team.id.toString()),
    );
    // extract all user ids
    const userIds = [];
    // get all filtered teams users if unrestricted
    if (!restricted && filteredTeams.length > 0) {
      for await (const team of filteredTeams) {
        // get users of each team
        const users = await this.teamMembersService.findAllTeamMembers(
          team.id,
          EMemberRole.Administrator,
        );
        userIds.push(...users.map((user) => user.userId));
      }
    }
    // else just get user's reports
    else userIds.push(loggedUser.id);

    const filter = {
      $and: [
        { report: new mongoose.Types.ObjectId(reportId) },
        { user: { $in: userIds } },
        { areaOfInterest: areaId },
      ],
    };
    //let filter = await createFilter(reportId, template, loggedUser, teams, query, areaId);
    const answers = await this.answerModel.find(filter);

    return await this.addUsernameToAnswers(answers);
  }

  async findSome(filter) {
    return await this.answerModel.find(filter);
  }

  async findOne(filter) {
    return await this.answerModel.findOne(filter);
  }

  /*   update(id: number, updateAnswerDto: UpdateAnswerDto) {
    return `This action updates a #${id} answer`;
  } */

  async delete(filter): Promise<void> {
    await this.answerModel.deleteMany(filter);
  }

  async addUsernameToAnswer(answer: AnswerDocument): Promise<AnswerDocument> {
    answer.fullName = await this.userService.getNameByIdMICROSERVICE(
      answer.user.toString(),
    );
    return answer;
  }

  async addUsernameToAnswers(
    answers: AnswerDocument[],
  ): Promise<AnswerDocument[]> {
    for await (let answer of answers)
      answer = await this.addUsernameToAnswer(answer);
    return answers;
  }
}
