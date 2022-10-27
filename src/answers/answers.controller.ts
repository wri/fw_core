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
} from '@nestjs/common';
import { AnswersService } from './services/answers.service';
import { CreateAnswerDto } from './dto/create-answer.dto';
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
    @Body() fields: CreateAnswerDto,
    @Req() request: Request,
    @UploadedFiles() fileArray?: Array<Express.Multer.File>,
  ) {
    const { user, template } = request;

    const userPosition = fields.userPosition
      ? fields.userPosition.split(',')
      : [];

    const files = fileArray?.reduce((acc, file) => {
      return { ...acc, [file.fieldname]: file };
    }, {} as { [fieldName: string]: Express.Multer.File });

    const answer: IAnswer = {
      report: template.id,
      reportName: fields.reportName,
      areaOfInterest: new mongoose.Types.ObjectId(fields.areaOfInterest),
      areaOfInterestName: fields.areaOfInterestName,
      language: fields.language,
      userPosition,
      clickedPosition: JSON.parse(fields.clickedPosition ?? '{}'),
      user: new mongoose.Types.ObjectId(user.id),
      createdAt: fields.date ?? Date.now().toString(),
      responses: [],
      teamId: fields.teamId,
    };

    const isFileTypeQuestion = (question: ITemplateQuestion) =>
      question.type === 'blob';
    const validateResponseTypeOrFail = (question: ITemplateQuestion) => {
      const hasFileResponse = !!files?.[question.name];
      const hasFieldResponse = !!fields[question.name];

      if (isFileTypeQuestion(question) && hasFieldResponse)
        throw new BadRequestException(
          `Expected file response for '${question.name}'`,
        );

      if (!isFileTypeQuestion(question) && hasFileResponse)
        throw new BadRequestException(
          `Expected non-file response for '${question.name}'`,
        );
    };
    const addResponseOrFail = async (question: ITemplateQuestion) => {
      if (isFileTypeQuestion(question)) {
        const file = files?.[question.name];
        const fileUrl = file
          ? await this.s3Service.uploadFile(file.path, file.filename)
          : undefined;
        answer.responses.push({ name: question.name, value: fileUrl });
        return;
      }

      answer.responses.push({
        name: question.name,
        value: fields[question.name].toString(),
      });
    };

    for (const question of template.questions) {
      validateResponseTypeOrFail(question);

      let name = question.name;
      if (question.required && !files?.[name] && !fields[name])
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
        const hasResponse = files?.[name] || fields[name];

        if (childQuestion.required && conditionMatches && !hasResponse)
          throw new BadRequestException(
            `${question.label[answer.language]} (${question.name}) required`,
          );

        await addResponseOrFail(question);
      }
    }

    const assignmentId = fields.assignmentId;
    if (!assignmentId) {
      const answerModel = await this.answersService.create(answer);
      return { data: serializeAnswers(answerModel) };
    }

    const assignment = this.assignmentService.findOne({
      _id: assignmentId,
      $or: [{ monitors: user.id }, { createdBy: user.id }],
    });

    if (!assignment)
      throw new UnauthorizedException(
        `User is not authorized to submit assignment ${assignmentId}`,
      );

    answer.assignmentId = new mongoose.Types.ObjectId(assignmentId);
    const answerModel = await this.answersService.create(answer);
    await this.assignmentService.update(assignmentId, {
      status: AssignmentStatus.COMPLETED,
    });

    return { data: serializeAnswers(answerModel) };
  }

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

  @Get()
  async findAll(@Req() request: Request) {
    const { template, user } = request;
    return {
      data: serializeAnswers(
        await this.answersService.getAllTemplateAnswers({ user, template }),
      ),
    };
  }

  @Get('/exports/:id')
  async findOneForExport(@Param('id') id: string, @Req() request: Request) {
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

    return {
      data: serializeAnswers(
        await this.answersService.addUsernameToAnswer(answer),
      ),
    };
  }

  /*   @Patch(':id')
  update(@Param('id') id: string, @Body() updateAnswerDto: UpdateAnswerDto) {
    return this.answersService.update(id, updateAnswerDto);
  } */

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

    await this.answersService.delete({ _id: id });
  }
}
