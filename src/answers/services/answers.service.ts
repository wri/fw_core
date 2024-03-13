import { Injectable } from '@nestjs/common';
import { Answer, AnswerDocument, IAnswer } from '../models/answer.model';
import { FilterQuery, Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { IUser } from '../../common/user.model';
import { TeamDocument } from '../../teams/models/team.schema';
import { EMemberRole } from '../../teams/models/teamMember.schema';
import { TeamMembersService } from '../../teams/services/teamMembers.service';
import mongoose from 'mongoose';
import { UserService } from '../../common/user.service';
import { TemplateDocument } from '../../templates/models/template.schema';
import { TeamsService } from '../../teams/services/teams.service';
import { TeamAreaRelationService } from '../../areas/services/teamAreaRelation.service';
import { UpdateAnswerDto } from '../dto/update-answer.dto';
import { BaseService } from '../../common/base.service';
import { TemplatesService } from '../../templates/templates.service';
import { MongooseObjectId } from '../../common/objectId';

@Injectable()
export class AnswersService extends BaseService<
  AnswerDocument,
  IAnswer,
  UpdateAnswerDto
> {
  constructor(
    @InjectModel(Answer.name, 'formsDb')
    private answerModel: Model<AnswerDocument>,
    private readonly teamMembersService: TeamMembersService,
    private readonly teamsService: TeamsService,
    private readonly teamAreaRelationService: TeamAreaRelationService,
    private readonly userService: UserService,
    private readonly templatesService: TemplatesService,
  ) {
    super(AnswersService.name, answerModel);
  }

  async create(answerInput: IAnswer): Promise<AnswerDocument> {
    const answer = await super.create(answerInput);
    return await this.addUsernameToAnswer(answer);
  }

  async getAllTemplateAnswers({
    template,
    user,
    userTeams,
  }: {
    template: TemplateDocument;
    user: IUser;
    userTeams: TeamDocument[];
  }): Promise<IAnswer[]> {
    let filter: FilterQuery<AnswerDocument> = {};
    const confirmedUsers: (mongoose.Types.ObjectId | undefined)[] = [];
    // add current user to users array
    confirmedUsers.push(new mongoose.Types.ObjectId(user.id));

    // get all user teams users
    for await (const team of userTeams) {
      // get users of each team
      const users = await this.teamMembersService.findAllTeamMembers(
        team.id,
        EMemberRole.Administrator,
      );
      confirmedUsers.push(...users.map((user) => user.userId));
    }

    // get all team areas
    const teamAreasRelations = await this.teamAreaRelationService.find({
      teamId: { $in: userTeams.map((team) => team.id) },
    });

    // Admin users and owners of the report template can check all report answers
    if (
      user.role === 'ADMIN' ||
      user.id.toString() === template.user.toString()
    ) {
      filter = {
        $and: [{ report: template._id }],
      };
    } else {
      // users can see their own answers and answers their team members have made as long as
      // area is in team areas
      filter = {
        $or: [
          {
            $and: [
              { report: template._id }, // report is from the template
              { user: { $in: confirmedUsers } }, // user is in the teams
              {
                areaOfInterest: {
                  $in: teamAreasRelations.map((relations) => relations.areaId), // report is from the team area
                },
              },
            ],
          },
          {
            $and: [
              { report: template._id }, // report is from the template
              { user: new mongoose.Types.ObjectId(user.id) }, // is user's report
            ],
          },
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
    // get all templates
    const publicTemplates =
      await this.templatesService.findAllPublicTemplates();
    const userTemplates = await this.templatesService.findAllByUserId(
      loggedUser.id,
    );
    const templates = [...publicTemplates, ...userTemplates];

    const answers: IAnswer[] = [];

    // get answers for each template
    for await (const template of templates) {
      answers.push(
        ...(await this.getAllTemplateAnswers({
          template,
          user: loggedUser,
          userTeams: teams,
        })),
      );
    }

    return answers;
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
    const userIds: (mongoose.Types.ObjectId | undefined)[] = [];
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
    else userIds.push(new mongoose.Types.ObjectId(loggedUser.id));

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

  async findOne(filter) {
    return await this.answerModel.findOne(filter);
  }

  /*   update(id: number, updateAnswerDto: UpdateAnswerDto) {
    return `This action updates a #${id} answer`;
  } */

  async deleteMany(filter): Promise<void> {
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

  /**
   * Fetch the sum of the count of answer responses for all versions in an edit group
   * @param editGroupId The id of the edit group of templates for which the answer count is to be fetched
   * @returns The count of answers in all versions of an edit group
   */
  async countByEditGroupId(
    editGroupId: string | MongooseObjectId,
  ): Promise<number> {
    const templates = await this.templatesService.findAllByEditGroupId(
      editGroupId,
    );

    return this.count({ report: { $in: templates.map((t) => t._id) } });
  }

  /**
   * Fetches the total answer count for a template
   * @param templateId Id of templates to get answer count for
   * @returns The count of answers for the given template
   */
  async countByTemplateId(
    templateId: string | MongooseObjectId,
  ): Promise<number> {
    return this.count({ report: templateId });
  }

  /**
   * Loops through all report answers and deletes any that no longer
   * have an associated template
   */
  async tidyUp(): Promise<void> {
    // get all answers
    const answers = await this.answerModel.find();
    const templates = await this.templatesService.find({});
    answers.forEach((answer) => {
      const templateId = answer.report;
      const template = templates.find(
        (template) =>
          template._id.toString() === templateId.toString() ||
          template.editGroupId?.toString() === templateId.toString(),
      );
      if (!template) {
        answer.delete();
      }
    });
  }
}
