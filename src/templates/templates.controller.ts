import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { TemplatesService } from './templates.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { IUser } from '../common/user.model';
import { AnswersService } from '../answers/services/answers.service';
import serializeTemplate from './serializers/template.serializer';
import { ETemplateStatus, ITemplateResponse } from './models/template.schema';
import { IAnswerReturn } from '../answers/models/answer.model';
import { TeamsService } from '../teams/services/teams.service';
import serializeAnswers from '../answers/serializers/answers.serializer';
import { TemplateAreaRelationService } from '../areas/services/templateAreaRelation.service';
import { CreateTemplateInput } from './input/create-template.input';
import { UserRole } from '../common/user-role.enum';
import { MongooseObjectId } from '../common/objectId';
import { UpdateStatusInput } from './input/update-status.input';
import { AuthUser } from '../common/decorators';
import { ValidateMongoId } from '../common/pipes/objectIdValidator.pipe';
import { UpdateTemplateInput } from './input/update-template.input';
import { ValidateBodyIsNotEmptyPipe } from '../common/pipes/validate-body-is-not-empty.pipe';
import { AreasService } from '../areas/services/areas.service';

@Controller('templates')
export class TemplatesController {
  constructor(
    private readonly templatesService: TemplatesService,
    private readonly answersService: AnswersService,
    private readonly teamsService: TeamsService,
    private readonly templateAreaRelationService: TemplateAreaRelationService,
    private readonly areasService: AreasService,
  ) {}
  private readonly logger = new Logger(TemplatesController.name);

  @Post()
  async create(
    @Body() body: CreateTemplateInput,
    @AuthUser() user: IUser,
  ): Promise<ITemplateResponse> {
    // Validate all translatable strings have the translations for all mentioned languages
    this.validateCreateTemplateLanguagesOrFail(body);

    if (user.role !== UserRole.ADMIN && body.public)
      throw new ForbiddenException('Only admins can make a template public');

    for (const id of body.areaIds ?? []) {
      // TODO: Validate if user has permission to access area
      const area = await this.areasService.getAreaMICROSERVICE(id);
      if (!area) throw new NotFoundException(`Area ${id} doesn't exist`);
    }

    const template: CreateTemplateDto = {
      name: body.name,
      user: new MongooseObjectId(user.id),
      languages: body.languages,
      defaultLanguage: body.defaultLanguage,
      questions: body.questions,
      public: body.public ?? false,
      status: body.status,
      editGroupId: new MongooseObjectId(),
      isLatest: true,
    };

    const savedTemplate = await this.templatesService.create(template);

    const relations =
      body.areaIds?.map((areaId) => ({
        templateId: savedTemplate.id,
        areaId,
      })) ?? [];
    await this.templateAreaRelationService.createMany(relations);

    savedTemplate.areas = body.areaIds
      ? await this.templateAreaRelationService.findAreasForTemplate(
          savedTemplate.id,
        )
      : [];
    return { data: serializeTemplate(savedTemplate) };
  }

  @Get('/public')
  async findAllPublicTemplates() {
    const templates = await this.templatesService.findAllPublicTemplates();

    return { data: serializeTemplate(templates) };
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
          template.id,
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
          template.id,
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
      await this.templateAreaRelationService.findAreasForTemplate(template.id);

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

    if (!answers)
      throw new NotFoundException('Answers not found for this user');

    return { data: serializeAnswers(answers) };
  }

  @Get('/:id')
  async findOne(
    @Param('id', ValidateMongoId) id: string,
    @AuthUser() user: IUser,
  ): Promise<ITemplateResponse> {
    this.logger.log('Obtaining template', id);
    const template = await this.templatesService.findOne({
      _id: new MongooseObjectId(id),
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
      await this.templateAreaRelationService.findAreasForTemplate(template.id);

    return { data: serializeTemplate(template) };
  }

  @Patch('/:id')
  async update(
    @Param('id') templateId: string,
    @Body(ValidateBodyIsNotEmptyPipe) body: UpdateTemplateInput,
    @AuthUser() user: IUser,
  ): Promise<ITemplateResponse> {
    const template = await this.templatesService.findById(templateId);

    if (
      !template ||
      (user.role !== UserRole.ADMIN && user.id !== template.user.toString())
    )
      throw new ForbiddenException(
        'User does not have permission to edit this template',
      );

    if (template.isLatest === false)
      throw new ForbiddenException('Cannot update older versions of templates');

    for (const id of body.areaIds ?? []) {
      // TODO: Validate if user has permission to access area
      const area = await this.areasService.getAreaMICROSERVICE(id);
      if (!area) throw new NotFoundException(`Area ${id} doesn't exist`);
    }

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
      public: template.public,
      status: template.status,
      editGroupId: template.editGroupId,
      isLatest: true,
    };

    this.validateCreateTemplateLanguagesOrFail(newTemplateDto);

    const updatedTemplate = await this.templatesService.create(newTemplateDto);

    template.isLatest = false;
    await template.save();

    const areaRelations =
      body.areaIds?.map((areaId) => ({
        templateId: updatedTemplate.id,
        areaId,
      })) ?? [];
    await this.templateAreaRelationService.createMany(areaRelations);

    // get answer count for each report
    const answersCount = await this.answersService.countByEditGroupId(
      template.editGroupId,
    );
    updatedTemplate.answersCount = answersCount;
    updatedTemplate.areas = body.areaIds
      ? await this.templateAreaRelationService.findAreasForTemplate(
          updatedTemplate.id,
        )
      : [];
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

    if (!template) throw new ForbiddenException();

    if (template.status === ETemplateStatus.PUBLISHED && user.role !== 'ADMIN')
      throw new ForbiddenException(
        'You cannot delete a published template. Please unpublish first.',
      );

    const answers = await this.answersService.find({ report: id });
    if (answers.length > 0 && user.role !== 'ADMIN')
      throw new ForbiddenException(
        'This report has answers, you cannot delete. Please unpublish instead.',
      );

    if (answers.length > 0)
      await this.answersService.deleteMany({ report: id });

    await this.templatesService.delete(id);
    await this.templateAreaRelationService.deleteMany({ report: id });
  }

  private validateCreateTemplateLanguagesOrFail(
    input: CreateTemplateInput | CreateTemplateDto,
  ): void {
    const getMissingLangs = (val: { [key: string]: any }) =>
      input.languages.filter((lang) => !val[lang]);

    const isDefaultLangInLanguages = input.languages.includes(
      input.defaultLanguage,
    );
    if (!isDefaultLangInLanguages)
      throw new BadRequestException(
        `default language '${input.defaultLanguage}' is not in languages`,
      );

    // Check if the template name has missing language translations
    const templateNameMissingLanguages = getMissingLangs(input.name);
    if (templateNameMissingLanguages.length > 0)
      throw new BadRequestException(
        `name doesn't have label for '${templateNameMissingLanguages}'`,
      );

    // Check each question and child question has the translated string for all languages
    input.questions.forEach((question, i) => {
      const labelMissingLanguages = getMissingLangs(question.label);
      if (labelMissingLanguages.length > 0)
        throw new BadRequestException(
          `question.${i} doesn't have label for '${labelMissingLanguages}'`,
        );

      const valuesMissingLanguages = question.values
        ? getMissingLangs(question.values)
        : [];
      if (valuesMissingLanguages.length > 0)
        throw new BadRequestException(
          `question.${i}.values doesn't have label for '${valuesMissingLanguages}'`,
        );

      question.childQuestions?.forEach((childQuestion, j) => {
        const labelMissingLanguages = getMissingLangs(childQuestion.label);
        if (labelMissingLanguages.length > 0)
          throw new BadRequestException(
            `question.${i}.childQuestions.${j} doesn't have label for '${labelMissingLanguages}'`,
          );

        const valuesMissingLanguages = childQuestion.values
          ? getMissingLangs(childQuestion.values)
          : [];
        if (valuesMissingLanguages.length > 0)
          throw new BadRequestException(
            `question.${i}.childQuestions.${j}values doesn't have label for '${valuesMissingLanguages}'`,
          );
      });
    });
  }
}
