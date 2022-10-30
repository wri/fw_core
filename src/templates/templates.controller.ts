import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Logger,
  Req,
  HttpStatus,
  HttpException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { TemplatesService } from './templates.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { IUser } from '../common/user.model';
import { Request } from 'express';
import { AnswersService } from '../answers/services/answers.service';
import serializeTemplate from './serializers/template.serializer';
import { ETemplateStatus, ITemplateResponse } from './models/template.schema';
import { IAnswerReturn } from '../answers/models/answer.model';
import { TeamsService } from '../teams/services/teams.service';
import serializeAnswers from '../answers/serializers/answers.serializer';
import { TemplateAreaRelationService } from '../areas/services/templateAreaRelation.service';
import mongoose from 'mongoose';
import { CreateTemplateInput } from './input/create-template.input';

@Controller('templates')
export class TemplatesController {
  constructor(
    private readonly templatesService: TemplatesService,
    private readonly answersService: AnswersService,
    private readonly teamsService: TeamsService,
    private readonly templateAreaRelationService: TemplateAreaRelationService,
  ) {}
  private readonly logger = new Logger(TemplatesController.name);

  @Post()
  async create(@Req() request: Request): Promise<ITemplateResponse> {
    const { body, user }: { body: CreateTemplateInput; user: IUser } = request;
    if (body.public && user.role !== 'ADMIN')
      throw new HttpException(
        'You must be an administrator to create a public template',
        HttpStatus.FORBIDDEN,
      );

    const template: CreateTemplateDto = {
      name: body.name,
      user: new mongoose.Types.ObjectId(user.id),
      languages: body.languages,
      defaultLanguage: body.defaultLanguage,
      questions: body.questions,
      public: body.public ?? false,
      status: body.status,
      editGroupId: new mongoose.Types.ObjectId(),
      isLatest: true,
    };

    const savedTemplate = await this.templatesService.create(template);

    return { data: serializeTemplate(savedTemplate) };
  }

  @Get('/latest')
  async findAllLatestVersionsByUser(
    @Req() request: Request,
  ): Promise<ITemplateResponse> {
    const user = request.user as IUser;

    this.logger.log(
      `Obtaining the latest version of all reports owned by user ${user.id}`,
    );

    const templates = await this.templatesService.findAllByUserId(user.id, {
      latest: true,
    });

    return { data: serializeTemplate(templates) };
  }

  @Get('/versions/:id')
  async findAllVersionsByUser(@Req() request: Request) {
    const user = request.user as IUser;
    const editGroupId = request.params.id;
    if (!editGroupId) {
      throw new BadRequestException('The id path parameter must be provided');
    }

    this.logger.log(
      `Obtaining all template versions of ${editGroupId} for user ${user.id}`,
    );

    const templates = await this.templatesService.findAllByEditGroupId(
      editGroupId,
      {
        user: user.id,
      },
    );

    return { data: serializeTemplate(templates) };
  }

  @Get()
  async findAll(@Req() request: Request): Promise<ITemplateResponse> {
    const user = request.user;
    const filter = {
      $and: [
        {
          $or: [
            { $and: [{ public: true }, { status: 'published' }] },
            { user: user.id },
          ],
        },
      ],
    };

    this.logger.log('Obtaining all user templates');
    const templates = await this.templatesService.find(filter);

    // get answer count for each report
    const numReports = templates.length;
    for (let i = 1; i < numReports; i++) {
      let answersFilter = {};
      if (user.role === 'ADMIN' || user.id === templates[i].user.toString()) {
        answersFilter = {
          report: templates[i].id,
        };
      } else {
        answersFilter = {
          user: user.id,
          report: templates[i].id,
        };
      }
      const answers = await this.answersService.findSome(answersFilter);
      templates[i].answersCount = answers.length || 0;
    }

    return { data: serializeTemplate(templates) };
  }

  @Get('/allAnswers')
  async getAllAnswers(@Req() request: Request): Promise<IAnswerReturn> {
    this.logger.log(`Obtaining all answers for user`);

    const user = request.user;

    // get teams the user is part of
    const userTeams = await this.teamsService.findAllByUserId(user.id);

    const answers = await this.answersService.getAllAnswers({
      loggedUser: user,
      teams: userTeams,
    });

    for await (const answer of answers) {
      const template = await this.templatesService.findOne({
        _id: answer.report,
      });
      answer.templateName = template?.name[answer.language];
    }

    if (!answers) {
      throw new HttpException(
        'Answers not found for this user',
        HttpStatus.NOT_FOUND,
      );
    } else return { data: serializeAnswers(answers) };
  }

  @Get('/:id')
  async findOne(
    @Param('id') id: string,
    @Req() request: Request,
  ): Promise<ITemplateResponse> {
    const user = request.user;

    this.logger.log('Obtaining template', id);
    const template = await this.templatesService.findOne({
      _id: new mongoose.Types.ObjectId(id),
    });

    if (!template) throw new NotFoundException();

    // get answer count for each report
    let answersFilter = {};
    if (user.role === 'ADMIN' || user.id === template.user.toString()) {
      answersFilter = {
        report: template.id,
      };
    } else {
      answersFilter = {
        user: user.id,
        report: template.id,
      };
    }
    const answers = await this.answersService.findSome(answersFilter);
    template.answersCount = answers.length;

    return { data: serializeTemplate(template) };
  }

  @Patch('/:id')
  async update(
    @Param('id') id: string,
    @Body() body: UpdateTemplateDto,
    @Req() request: Request,
  ): Promise<ITemplateResponse> {
    const user = request.user;

    // create filter to grab existing template
    const filter: any = {
      $and: [{ _id: new mongoose.Types.ObjectId(id) }],
    };
    if (user.role !== 'ADMIN') {
      filter.$and.push({ user: new mongoose.Types.ObjectId(user.id) });
    }
    // get the template based on the filter
    const templateToUpdate = await this.templatesService.findOne(filter);
    if (!templateToUpdate)
      throw new HttpException(
        'You do not have permission to edit this template',
        HttpStatus.FORBIDDEN,
      );
    // stop public status of template being changed if not admin
    if (user.role !== 'ADMIN' && body.hasOwnProperty('public'))
      delete body.public;
    const template = await this.templatesService.update(id, body);

    // get answer count for each report
    let answersFilter = {};
    if (user.role === 'ADMIN' || user.id === template.user.toString()) {
      answersFilter = {
        report: template.id,
      };
    } else {
      answersFilter = {
        user: user.id,
        report: template.id,
      };
    }
    const answers = await this.answersService.findSome(answersFilter);
    template.answersCount = answers.length;
    return { data: serializeTemplate(template) };
  }

  @Delete('/allAnswers')
  async deleteAllAnswers(@Req() request: Request): Promise<void> {
    const user = request.user;

    await this.answersService.deleteMany({ user: user.id });
  }

  @Delete('/:id')
  async remove(
    @Param('id') id: string,
    @Req() request: Request,
  ): Promise<void> {
    const user = request.user;

    const template = await this.templatesService.findById(id);

    if (!template) {
      throw new ForbiddenException();
    }

    if (
      template.status === ETemplateStatus.PUBLISHED &&
      user.role !== 'ADMIN'
    ) {
      throw new ForbiddenException(
        'You cannot delete a published template. Please unpublish first.',
      );
    }

    const answers = await this.answersService.findSome({ report: id });
    if (answers.length > 0 && user.role !== 'ADMIN') {
      throw new ForbiddenException(
        'This report has answers, you cannot delete. Please unpublish instead.',
      );
    }

    if (answers.length > 0) {
      await this.answersService.deleteMany({ report: id });
    }

    await this.templatesService.delete(id);
    await this.templateAreaRelationService.deleteMany({ report: id });
  }
}
