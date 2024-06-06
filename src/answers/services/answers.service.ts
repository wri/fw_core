import { Injectable } from '@nestjs/common';
import {
  Answer,
  AnswerDocument,
  IAnswer,
  IAnswerFile,
  IAnswerResponse,
} from '../models/answer.model';
import { FilterQuery, Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { IUser } from '../../common/user.model';
import { TeamDocument } from '../../teams/models/team.schema';
import { EMemberRole } from '../../teams/models/teamMember.schema';
import { TeamMembersService } from '../../teams/services/teamMembers.service';
import mongoose from 'mongoose';
import { UserService } from '../../common/user.service';
import { TemplateDocument } from '../../templates/models/template.schema';
import { TeamAreaRelationService } from '../../areas/services/teamAreaRelation.service';
import { UpdateAnswerDto } from '../dto/update-answer.dto';
import { BaseService } from '../../common/base.service';
import { TemplatesService } from '../../templates/templates.service';
import { MongooseObjectId } from '../../common/objectId';
import { S3Service } from './s3Service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AnswersService extends BaseService<
  AnswerDocument,
  IAnswer,
  UpdateAnswerDto
> {
  private readonly S3_FOLDER: string;

  constructor(
    @InjectModel(Answer.name, 'formsDb')
    private answerModel: Model<AnswerDocument>,
    private readonly teamMembersService: TeamMembersService,
    private readonly teamAreaRelationService: TeamAreaRelationService,
    private readonly userService: UserService,
    private readonly templatesService: TemplatesService,
    private readonly s3Service: S3Service,
    configService: ConfigService,
  ) {
    super(AnswersService.name, answerModel);

    this.S3_FOLDER = configService.getOrThrow('s3.folder');
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
  }: {
    loggedUser: IUser;
  }): Promise<IAnswer[]> {
    let filter = {};
    const teamMembers = await this.teamMembersService.findEveryTeamMember(
      loggedUser.id,
    );
    teamMembers.push(loggedUser.id);

    filter = { user: { $in: teamMembers } };

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

  async findOne(filter): Promise<AnswerDocument | null> {
    return this.answerModel.findOne(filter);
  }

  async updateImagePermissions(
    input: UpdateAnswerDto,
  ): Promise<AnswerDocument | undefined> {
    const answer = await this.answerModel.findById(input.id);
    if (!answer) throw new Error('answer does not exist');
    const promises = answer.responses.map(
      async (response) =>
        await this.updateResponse({
          response,
          privateFiles: input.privateFiles,
          publicFiles: input.publicFiles,
        }),
    );
    answer.responses = await Promise.all(promises);
    return answer?.save();
  }

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

  async getUrls(answer: AnswerDocument): Promise<AnswerDocument> {
    const responses = answer.responses;
    for await (const response of responses) {
      if (response.value && this.isUrlArrayType(response.value)) {
        const presignedUrlPromises = response.value.map(
          async (file: IAnswerFile) => ({
            url: await this.s3Service.generatePresignedUrl({
              key: file.url,
            }),
            isPublic: file.isPublic,
          }),
        );
        response.value = await Promise.all(presignedUrlPromises);
      }
      if (response.value && this.isURLObjectType(response.value)) {
        response.value = {
          url: await this.s3Service.generatePresignedUrl({
            key: response.value.url,
          }),
          isPublic: response.value.isPublic,
        };
      }
    }
    answer.responses = responses;
    return answer;
  }

  isStringType(
    responseValue: string | string[] | IAnswerFile | IAnswerFile[] | undefined,
  ): responseValue is string {
    return typeof responseValue === 'string';
  }

  isStringArrayType(
    responseValue: string | string[] | IAnswerFile | IAnswerFile[] | undefined,
  ): responseValue is string[] {
    return Array.isArray(responseValue) && typeof responseValue[0] === 'string';
  }

  isURLObjectType(
    responseValue: string | string[] | IAnswerFile | IAnswerFile[] | undefined,
  ): responseValue is IAnswerFile {
    return (
      !!responseValue &&
      !Array.isArray(responseValue) &&
      typeof responseValue !== 'string'
    );
  }

  isUrlArrayType(
    responseValue: string | string[] | IAnswerFile | IAnswerFile[] | undefined,
  ): responseValue is IAnswerFile[] {
    return Array.isArray(responseValue) && typeof responseValue[0] !== 'string';
  }

  async updateResponse({
    response,
    privateFiles,
    publicFiles,
  }: {
    response: IAnswerResponse;
    privateFiles: string[];
    publicFiles: string[];
  }): Promise<IAnswerResponse> {
    const privateFilenames = privateFiles.map((file) => {
      const filenameArray = file.split(this.S3_FOLDER);
      return filenameArray.pop();
    });
    const publicFilenames = publicFiles.map((file) => {
      const filenameArray = file.split(this.S3_FOLDER);
      return filenameArray.pop();
    });
    if (this.isURLObjectType(response.value)) {
      if (
        privateFilenames.includes(
          response.value.url.split(this.S3_FOLDER).pop(),
        )
      ) {
        await this.s3Service.updateFile({
          url: response.value.url,
          isPublic: false,
        });
        return {
          name: response.name,
          value: { url: response.value.url, isPublic: false },
        };
      }
      if (
        publicFilenames.includes(response.value.url.split(this.S3_FOLDER).pop())
      ) {
        await this.s3Service.updateFile({
          url: response.value.url,
          isPublic: true,
        });
        return {
          name: response.name,
          value: { url: response.value.url, isPublic: true },
        };
      }
      return response;
    }
    if (this.isUrlArrayType(response.value)) {
      const promises = response.value.map(async (file) => {
        if (privateFilenames.includes(file.url.split(this.S3_FOLDER).pop())) {
          await this.s3Service.updateFile({
            url: file.url,
            isPublic: false,
          });
          return { url: file.url, isPublic: false };
        }
        if (publicFilenames.includes(file.url.split(this.S3_FOLDER).pop())) {
          await this.s3Service.updateFile({
            url: file.url,
            isPublic: true,
          });
          return { url: file.url, isPublic: true };
        }
        return file;
      });
      const resolvedPromises = await Promise.all(promises);
      return { name: response.name, value: resolvedPromises };
    }
    return response;
  }
}
