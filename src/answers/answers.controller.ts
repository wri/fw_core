import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Req,
  HttpException,
  HttpStatus,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
  UnauthorizedException,
  Patch,
} from '@nestjs/common';
import { AnswersService } from './services/answers.service';
import { Request } from 'express';
import serializeAnswers from './serializers/answers.serializer';
import { TeamMembersService } from '../teams/services/teamMembers.service';
import { EMemberRole } from '../teams/models/teamMember.schema';
import mongoose from 'mongoose';
import { IAnswer } from './models/answer.model';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { S3Service } from './services/s3Service';
import { TeamAreaRelationService } from '../areas/services/teamAreaRelation.service';
import { AssignmentStatus } from '../assignments/assignment-status.enum';
import { AssignmentsService } from '../assignments/assignments.service';
import { ITemplateQuestion } from '../templates/models/template.schema';
import { QuestionType } from '../templates/question-type.enum';
import { CreateAnswerInput } from './inputs/create-answer.input';
import { AuthUser } from '../common/decorators';
import { IUser } from '../common/user.model';
import { UpdateAnswerInput } from './inputs/update-answer.input';

@Controller('templates/:templateId/answers')
export class AnswersController {
  constructor(
    private readonly answersService: AnswersService,
    private readonly teamMembersService: TeamMembersService,
    private readonly teamAreaRelationService: TeamAreaRelationService,
    private readonly s3Service: S3Service,
    private readonly assignmentService: AssignmentsService,
  ) {}

  @Post()
  @UseInterceptors(AnyFilesInterceptor({ dest: './tmp' }))
  async create(
    @Body() fields: CreateAnswerInput,
    @Req() request: Request,
    @AuthUser() user: IUser,
    @UploadedFiles() fileArray?: Array<Express.Multer.File>,
  ) {
    const { template } = request;

    const userPosition = fields.userPosition ?? [];

    // This groups the file uploads by fieldname
    const fileGroups = fileArray?.reduce((acc, file) => {
      const questionName = file.fieldname;
      const value = acc[questionName];
      return {
        ...acc,
        [questionName]: value ? [...value, file] : [file],
      };
    }, {} as { [fieldName: string]: Express.Multer.File[] | undefined });

    const answer: IAnswer = {
      report: template.id,
      reportName: fields.reportName,
      areaOfInterest: new mongoose.Types.ObjectId(fields.areaOfInterest),
      areaOfInterestName: fields.areaOfInterestName,
      language: fields.language,
      userPosition,
      clickedPosition: fields.clickedPosition,
      user: new mongoose.Types.ObjectId(user.id),
      createdAt: fields.date?.toString() ?? Date.now().toString(),
      responses: [],
      teamId: fields.teamId,
    };

    const isFileTypeQuestion = (question: ITemplateQuestion) =>
      [QuestionType.AUDIO, QuestionType.IMAGE].includes(question.type);
    const validateResponseTypeOrFail = (question: ITemplateQuestion) => {
      const hasFileResponse = !!fileGroups?.[question.name];
      const hasFieldResponse = !!fields[question.name];

      if (isFileTypeQuestion(question) && hasFieldResponse)
        throw new BadRequestException(
          `Expected file response for '${question.name}'`,
        );

      if (!isFileTypeQuestion(question) && hasFileResponse)
        throw new BadRequestException(
          `Expected non-file response for '${question.name}'`,
        );

      if (question.type === QuestionType.IMAGE) {
        const uploadCount = fileGroups?.[question.name]?.length ?? 0;
        const maxCount = question.maxImageCount ?? 5;
        if (uploadCount > maxCount)
          throw new BadRequestException(
            `Maximum file count (${maxCount}) exceeded for question '${question.name}'`,
          );
      }
    };
    const addResponseOrFail = async (
      question: ITemplateQuestion,
    ): Promise<unknown> => {
      if (!isFileTypeQuestion(question)) {
        return answer.responses.push({
          name: question.name,
          value: fields[question.name]?.toString(),
        });
      }

      const files = fileGroups?.[question.name];
      if (!files) {
        return answer.responses.push({ name: question.name, value: undefined });
      }

      if (question.type === QuestionType.AUDIO) {
        const [file] = files;
        const isPublic = fields.publicFiles?.includes(file.originalname);
        const fileUrl = await this.s3Service.uploadFile({
          filePath: file.path,
          fullFileName: file.originalname,
          isPublic,
        });
        return answer.responses.push({
          name: question.name,
          value: { url: fileUrl, isPublic },
        });
      }

      if (question.type === QuestionType.IMAGE) {
        for await (const file of files) {
          const isPublic = fields.publicFiles?.includes(file.originalname);
          const returnedUrl = await this.s3Service.uploadFile({
            filePath: file.path,
            fullFileName: file.originalname,
            isPublic,
          });
          return answer.responses.push({
            name: question.name,
            value: { url: returnedUrl, isPublic },
          });
        }
      }

      return;
    };

    for (const question of template.questions) {
      validateResponseTypeOrFail(question);

      const name = question.name;
      if (question.required && !fileGroups?.[name] && !fields[name])
        throw new BadRequestException(
          `${question.label[answer.language]} (${question.name}) required`,
        );

      await addResponseOrFail(question);

      if (!question.childQuestions) continue;
      for (const childQuestion of question.childQuestions) {
        validateResponseTypeOrFail(childQuestion);

        const parentName = question.name;
        const name = childQuestion.name;
        const conditionMatches =
          fields[parentName] && childQuestion.conditionalValue === fields[name];
        const hasResponse = fileGroups?.[name] || fields[name];

        if (childQuestion.required && conditionMatches && !hasResponse)
          throw new BadRequestException(
            `${question.label[answer.language]} (${question.name}) required`,
          );

        await addResponseOrFail(childQuestion);
      }
    }

    const assignmentId = fields.assignmentId;
    if (!assignmentId) {
      const answerModel = await this.answersService.create(answer);
      const answerWithUrls = await this.answersService.getUrls(answerModel);
      return { data: serializeAnswers(answerWithUrls) };
    }

    const assignment = await this.assignmentService.findOne({
      _id: assignmentId,
      monitors: user.id,
    });

    if (!assignment)
      throw new UnauthorizedException(
        `User is not authorized to submit assignment ${assignmentId}`,
      );

    if (!assignment.templateIds.includes(template.id))
      throw new BadRequestException(
        `Assignment does not belong to template ${template.id}`,
      );

    answer.assignmentId = new mongoose.Types.ObjectId(assignmentId);
    const answerModel = await this.answersService.create(answer);
    const answerWithUrls = await this.answersService.getUrls(answerModel);

    if (assignment.status !== AssignmentStatus.COMPLETED)
      await this.assignmentService.update(assignmentId, {
        status: AssignmentStatus.COMPLETED,
      });

    return { data: serializeAnswers(answerWithUrls) };
  }

  /**
   * Fetches all answers for given template and area for user and area teams
   * @param templateId Id of template to get answers for
   * @param areaId Id of area to get answers for
   * @returns Answers for the given template and area
   */
  @Get('/areas/:areaId')
  async getAreaAnswers(
    @Req() request: Request,
    @Param('areaId') areaId: string,
  ) {
    const { template, query, userTeams, user } = request;
    let restricted = false;
    if (query && query.restricted === 'true') restricted = true;

    const answers = await this.answersService.filterAnswersByArea({
      reportId: template.id,
      teams: userTeams,
      areaId,
      loggedUser: user,
      restricted,
    });

    if (!answers)
      throw new HttpException(
        'no answers found with current permissions',
        HttpStatus.NOT_FOUND,
      );
    return { data: serializeAnswers(answers) };
  }

  /**
   * Fetches all answers for given template by user and users team
   * @param templateId Id of template to get answers for
   * @returns Answers for the given template
   */
  @Get()
  async findAll(@Req() request: Request) {
    const { template, user, userTeams } = request;
    return {
      data: serializeAnswers(
        await this.answersService.getAllTemplateAnswers({
          user,
          template,
          userTeams,
        }),
      ),
    };
  }

  @Get('/exports/:id')
  async findOneForExport(@Param('id') id: string) {
    const answer = await this.answersService.findOne({
      _id: new mongoose.Types.ObjectId(id),
    });
    if (!answer)
      throw new HttpException(
        'No answer found with your permissions',
        HttpStatus.NOT_FOUND,
      );

    return {
      data: serializeAnswers(
        await this.answersService.addUsernameToAnswer(answer),
      ),
    };
  }

  @Get('/:id')
  async findOne(@Param('id') id: string, @Req() request: Request) {
    let filter: any = {};
    const { template, user, userTeams = [] } = request;

    const confirmedUsers: (mongoose.Types.ObjectId | undefined)[] = [];
    for await (const team of userTeams) {
      // get members of each team user belongs to and add to users array
      const users = await this.teamMembersService.findAllTeamMembers(
        team.id,
        EMemberRole.Administrator,
      );
      confirmedUsers.push(...users.map((user) => user.userId));
    }

    // add current user to users array
    confirmedUsers.push(new mongoose.Types.ObjectId(user.id));

    // users can see all answers from their own template or answers made from team members from other templates
    if (user.role === 'ADMIN' || user.id === template.user.toString()) {
      filter = {
        _id: new mongoose.Types.ObjectId(id),
        report: template.id,
      };
    } else {
      filter = {
        user: { $in: confirmedUsers },
        _id: new mongoose.Types.ObjectId(id),
        report: template.id,
      };
    }

    const answer = await this.answersService.findOne(filter);
    if (!answer)
      throw new HttpException(
        'No answer found with your permissions',
        HttpStatus.NOT_FOUND,
      );

    const answerWithUrls = await this.answersService.getUrls(answer);

    return {
      data: serializeAnswers(
        await this.answersService.addUsernameToAnswer(answerWithUrls),
      ),
    };
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() input: UpdateAnswerInput) {
    return this.answersService.updateImagePermissions({ id, ...input });
  }

  @Delete('/:id')
  async remove(
    @Param('id') id: string,
    @Req() request: Request,
  ): Promise<void> {
    const { user, userTeams } = request;
    // only the answer creator OR a manager for the area can delete the answer
    let permitted = false;
    // get the answer
    const answer = await this.answersService.findOne({
      _id: new mongoose.Types.ObjectId(id),
    });
    if (answer?.user.toString() === user.id.toString()) permitted = true;
    else {
      // get associated teams of answer area
      const areaTeams = await this.teamAreaRelationService.find({
        areaId: answer?.areaOfInterest,
      });

      // create array user is manager of
      const managerTeams: string[] = [];
      userTeams.forEach((userTeam) => {
        if (
          userTeam.userRole === 'manager' ||
          userTeam.userRole === 'administrator'
        )
          managerTeams.push(userTeam.id.toString());
      });
      // create an array of teams in which the team is associated with the area AND the user is a manager of
      const managerArray = areaTeams.filter((areaTeamRelation) =>
        managerTeams.includes(areaTeamRelation.teamId.toString()),
      );
      if (managerArray.length > 0) permitted = true;
    }

    if (!permitted)
      throw new HttpException(
        'You are not authorised to delete this record',
        HttpStatus.FORBIDDEN,
      );

    await this.answersService.delete(id);
  }
}
