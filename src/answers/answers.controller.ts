import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  HttpException,
  HttpStatus,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { AnswersService } from './services/answers.service';
import { CreateAnswerDto } from './dto/create-answer.dto';
import { UpdateAnswerDto } from './dto/update-answer.dto';
import { Request } from 'express';
import serializeAnswers from './serializers/answers.serializer';
import { TeamMembersService } from '../teams/services/teamMembers.service';
import { EMemberRole } from '../teams/models/teamMember.schema';
import mongoose from 'mongoose';
import { IAnswer } from './models/answer.model';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { S3Service } from './services/s3Service';
import { TeamAreaRelationService } from '../areas/services/teamAreaRelation.service';

@Controller('templates/:templateId/answers')
export class AnswersController {
  constructor(
    private readonly answersService: AnswersService,
    private readonly teamMembersService: TeamMembersService,
    private readonly teamAreaRelationService: TeamAreaRelationService,
    private readonly s3Service: S3Service,
  ) {}

  @Post()
  @UseInterceptors(AnyFilesInterceptor({ dest: './tmp' }))
  async create(
    @UploadedFiles() fileArray: Array<Express.Multer.File>,
    @Body() fields: CreateAnswerDto,
    @Req() request: Request,
  ) {
    const { user, template } = request;
    let userPosition = [];
    const files = {};
    if (fileArray) fileArray.forEach((file) => (files[file.fieldname] = file));

    try {
      userPosition = fields.userPosition ? fields.userPosition.split(',') : [];
    } catch (e) {
      throw new HttpException(
        `Position values must be separated by ','`,
        HttpStatus.BAD_REQUEST,
      );
    }
    const answer: IAnswer = {
      report: template.id,
      reportName: fields.reportName,
      areaOfInterest: new mongoose.Types.ObjectId(fields.areaOfInterest),
      areaOfInterestName: fields.areaOfInterestName,
      language: fields.language,
      userPosition,
      clickedPosition: JSON.parse(fields.clickedPosition),
      user: new mongoose.Types.ObjectId(user.id),
      createdAt: fields.date,
      responses: [],
    };

    if (fields.teamId) answer.teamId = fields.teamId.toString();

    const pushResponse = (question, response) => {
      answer.responses.push({
        name: question.name,
        value: typeof response !== 'undefined' ? response : null,
      });
    };
    const pushError = (question) => {
      throw new HttpException(
        `${question.label[answer.language]} (${question.name}) required`,
        HttpStatus.BAD_REQUEST,
      );
    };
    const { questions } = template;
    if (!questions || (questions && !questions.length)) {
      throw new HttpException(
        `No question associated with this report`,
        HttpStatus.BAD_REQUEST,
      );
    }

    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];

      let fileAnswer;

      // handle parent questions
      const bodyAnswer = fields[question.name];
      if (files) fileAnswer = files[question.name];
      let response =
        typeof bodyAnswer !== 'undefined' ? bodyAnswer : fileAnswer;
      if (!response && question.required) {
        pushError(question);
      }
      if (
        response &&
        response.path &&
        response.filename &&
        question.type === 'blob'
      ) {
        // upload file
        response = await this.s3Service.uploadFile(
          response.path,
          response.filename,
        );
      }

      pushResponse(question, response);
      // handle child questions
      if (question.childQuestions) {
        for (let j = 0; j < question.childQuestions.length; j++) {
          const childQuestion = question.childQuestions[j];
          const childBodyAnswer = fields[childQuestion.name];
          const childFileAnswer = files[childQuestion.name];
          const conditionMatches =
            typeof bodyAnswer !== 'undefined' &&
            childQuestion.conditionalValue === bodyAnswer;
          let childResponse =
            typeof childBodyAnswer !== 'undefined'
              ? childBodyAnswer
              : childFileAnswer;
          if (!childResponse && childQuestion.required && conditionMatches) {
            pushError(childQuestion);
          }
          if (childResponse && childQuestion.type === 'blob') {
            // upload file
            childResponse = await this.s3Service.uploadFile(
              response.path,
              response.filename,
            );
          }
          pushResponse(childQuestion, childResponse);
        }
      }
    }
    const answerModel = await this.answersService.create(answer);
    return { data: serializeAnswers(answerModel) };
  }

  @Get('/area/:areaId')
  async getAreaAnswers(
    @Req() request: Request,
    @Param('areaId') areaId: string,
  ) {
    const { user, template, query, userTeams } = request;
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
    const { user, template } = request;
    return {
      data: serializeAnswers(
        await this.answersService.getAllTemplateAnswers({ user, template }),
      ),
    };
  }

  @Get('/:id')
  async findOne(@Param('id') id: string, @Req() request: Request) {
    let filter: any = {};
    const { user, template, userTeams = [] } = request;

    const confirmedUsers = [];
    for await (const team of userTeams) {
      // get members of each team user belongs to and add to users array
      const users = await this.teamMembersService.findAllTeamMembers(
        team.id,
        EMemberRole.Administrator,
      );
      confirmedUsers.push(...users.map((user) => user.userId));
    }

    // add current user to users array
    confirmedUsers.push(user.id);

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
    if (answer.user.toString() === user.id.toString()) permitted = true;
    else {
      // get associated teams of answer area
      const areaTeams = await this.teamAreaRelationService.find({
        areaId: answer.areaOfInterest,
      });

      // create array user is manager of
      const managerTeams = [];
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
