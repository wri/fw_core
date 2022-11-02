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
  ForbiddenException,
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
import { UserRole } from '../common/user-role.enum';
import { MongooseObjectId } from '../common/objectId';
import { UpdateStatusInput } from './input/update-status.input';
import { AuthUser } from '../common/decorators';
import { ValidateMongoId } from '../common/objectIdValidator.pipe';

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
  async create(
    @Req() request: Request,
    @AuthUser() user: IUser,
  ): Promise<ITemplateResponse> {
    const { body }: { body: CreateTemplateInput; user: IUser } = request;
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
    savedTemplate.areas = [];

    return { data: serializeTemplate(savedTemplate) };
  }

  @Get('/latest')
  async findAllLatestVersionsByUser(
    @AuthUser() user: IUser,
  ): Promise<ITemplateResponse> {
    this.logger.log(
      `Obtaining the latest version of all reports owned by user ${user.id}`,
    );

    const templates = await this.templatesService.findAllByUserId(user.id, {
      latest: true,
    });

    for (const template of templates) {
      const answersCount = template.editGroupId
        ? await this.answersService.countByEditGroupId(template.editGroupId)
        : await this.answersService.countByTemplateId(template.id);
      template.answersCount = answersCount;
      template.areas =
        await this.templateAreaRelationService.findAreasForTemplate(
          template.editGroupId ? template.editGroupId.toString() : template.id,
        );
    }

    return { data: serializeTemplate(templates) };
  }

  @Get('/versions/:id')
  async findAllVersionsByGroupIdForUser(
    @AuthUser() user: IUser,
    @Param('id') editGroupId?: string,
  ) {
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

    for (const template of templates) {
      const answersCount = await this.answersService.countByTemplateId(
        template.id,
      );
      template.answersCount = answersCount;
      template.areas =
        await this.templateAreaRelationService.findAreasForTemplate(
          template.editGroupId ? template.editGroupId.toString() : template.id,
        );
    }

    return { data: serializeTemplate(templates) };
  }

  @Get('/versions/:id/latest')
  async findLatestVersionByGroupIdForUser(
    @AuthUser() user: IUser,
    @Param('id') editGroupId?: string,
  ) {
    if (!editGroupId) {
      throw new BadRequestException('The id path parameter must be provided');
    }

    this.logger.log(
      `Obtaining all template versions of ${editGroupId} for user ${user.id}`,
    );

    const [template] = await this.templatesService.findAllByEditGroupId(
      editGroupId,
      {
        user: user.id,
        latest: true,
      },
    );

    template.answersCount = await this.answersService.countByEditGroupId(
      editGroupId,
    );

    template.areas =
      await this.templateAreaRelationService.findAreasForTemplate(
        template.editGroupId ? template.editGroupId.toString() : template.id,
      );

    return { data: serializeTemplate(template) };
  }

  @Get()
  async findAll(@AuthUser() user: IUser): Promise<ITemplateResponse> {
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
      const answers = await this.answersService.find(answersFilter);
      templates[i].answersCount = answers.length || 0;
    }

    return { data: serializeTemplate(templates) };
  }

  @Get('/allAnswers')
  async getAllAnswers(@AuthUser() user: IUser): Promise<IAnswerReturn> {
    this.logger.log(`Obtaining all answers for user`);

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
    @Param('id', ValidateMongoId) id: string,
    @AuthUser() user: IUser,
  ): Promise<ITemplateResponse> {
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
    const answers = await this.answersService.find(answersFilter);
    template.answersCount = answers.length;
    template.areas =
      await this.templateAreaRelationService.findAreasForTemplate(
        template.editGroupId ? template.editGroupId.toString() : template.id,
      );

    return { data: serializeTemplate(template) };
  }

  @Patch('/:id')
  async update(
    @Param('id') templateId: string,
    @Body() body: UpdateTemplateDto,
    @AuthUser() user: IUser,
  ): Promise<ITemplateResponse> {
    if (user.role !== UserRole.ADMIN && body.public !== undefined)
      throw new ForbiddenException('Only admin can change the public property');

    const template = await this.templatesService.findById(templateId);

    if (
      !template ||
      (user.role !== UserRole.ADMIN && user.id !== template.user.toString())
    ) {
      throw new ForbiddenException();
    }

    if (template.isLatest === false)
      throw new ForbiddenException('Cannot update older versions of templates');

    if (!template.editGroupId) {
      template.editGroupId = new MongooseObjectId();
      await template.save();
    }

    if (template.isLatest === undefined) {
      template.isLatest = true;
      await template.save();
    }

    const newTemplateDto: CreateTemplateDto = {
      name: body.name ?? template.name,
      user: template.user,
      languages: body.languages ?? template.languages,
      defaultLanguage: body.defaultLanguage ?? template.defaultLanguage,
      questions: body.questions ?? template.questions,
      public: body.public ?? template.public,
      status: ETemplateStatus.UNPUBLISHED,
      editGroupId: template.editGroupId,
      isLatest: true,
    };

    const updatedTemplate = await this.templatesService.create(newTemplateDto);

    template.isLatest = false;
    await template.save();

    // get answer count for each report
    const answersCount = await this.answersService.countByEditGroupId(
      template.editGroupId,
    );
    updatedTemplate.answersCount = answersCount;
    updatedTemplate.areas =
      await this.templateAreaRelationService.findAreasForTemplate(
        template.editGroupId ? template.editGroupId.toString() : template.id,
      );
    return { data: serializeTemplate(updatedTemplate) };
  }

  @Patch('/:id/status')
  async updateStatus(
    @Param('id') templateId: string,
    @AuthUser() user: IUser,
    @Body() body: UpdateStatusInput,
  ): Promise<ITemplateResponse> {
    const template = await this.templatesService.findById(templateId);

    if (
      !template ||
      (user.role !== UserRole.ADMIN && user.id !== template.user.toString())
    ) {
      throw new ForbiddenException();
    }

    template.status = body.status;
    await template.save();

    return { data: serializeTemplate(template) };
  }

  @Delete('/allAnswers')
  async deleteAllAnswers(@AuthUser() user: IUser): Promise<void> {
    await this.answersService.deleteMany({ user: user.id });
  }

  @Delete('/:id')
  async remove(
    @Param('id') id: string,
    @AuthUser() user: IUser,
  ): Promise<void> {
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

    const answers = await this.answersService.find({ report: id });
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
