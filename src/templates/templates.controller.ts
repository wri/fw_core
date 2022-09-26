import { Controller, Get, Post, Body, Patch, Param, Delete, Logger, Req, HttpCode, HttpStatus, HttpException } from '@nestjs/common';
import { TemplatesService } from './templates.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { IUser } from '../common/user.model';
import { Request } from "express"
import { AnswersService } from '../answers/answers.service';
import serializeTemplate from './serializers/template.serializer';
import { ITemplateResponse } from './models/template.schema';
import { IAnswerReturn } from '../answers/models/answer.model';
import { TeamsService } from '../teams/services/teams.service';
import serializeAnswers from '../answers/serializers/answers.serializer';

@Controller('templates')
export class TemplatesController {
  constructor(
    private readonly templatesService: TemplatesService,
    private readonly answersService: AnswersService,
    private readonly teamsService: TeamsService
    ) {}
  private readonly logger = new Logger(TemplatesController.name);
  
  @Post()
  create(@Body() createTemplateDto: CreateTemplateDto) {
    return this.templatesService.create(createTemplateDto);
  }

  @Get()
  async findAll(@Req() request: Request): Promise<ITemplateResponse> {
    const { user }: {user: IUser} = request;
    const filter = {
      $and: [
        {
          $or: [{ $and: [{ public: true }, { status: "published" }] }, { user: user.id }]
        }
      ]
    };
/*     if (ctx.state.query) {
      Object.keys(ctx.state.query).forEach(key => {
        filter.$and.push({ [key]: ctx.state.query[key] });
      });
    } */
    this.logger.log("Obtaining all user templates");
    const templates = await this.templatesService.findSome(filter) //  ReportsModel.find(filter);

    // get answer count for each report
    const numReports = templates.length;
    for (let i = 1; i < numReports; i++) {
      let answersFilter = {};
      if (user.role === "ADMIN" || user.id === templates[i].user) {
        answersFilter = {
          report: templates[i].id
        };
      } else {
        answersFilter = {
          user: user.id,
          report: templates[i].id
        };
      }
      const answers = await this.answersService.findSome(answersFilter); // AnswersModel.count(answersFilter);
      templates[i].answersCount = answers.length || 0;
    }

    return {data: serializeTemplate(templates)};
  }

  @Get('/getAllAnswersForUser')
  async getAllAnswersForUser(@Req() request: Request): Promise<IAnswerReturn> {
    this.logger.log(`Obtaining all answers for user`);

    const { user }: {user: IUser} = request;

    // get teams the user is part of
    const userTeams = await this.teamsService.findAllByUserId(user.id);

    const answers = await this.answersService.getAllAnswers({
      loggedUser: user,
      teams: userTeams
    });

    for await (const answer of answers) {
      const template = await this.templatesService.findOne({ _id: answer.report });
      answer.templateName = template.name[answer.language];
    }

    if (!answers) {
      throw new HttpException("Answers not found for this user", HttpStatus.NOT_FOUND)
      return;
    } else return { data: serializeAnswers(answers) };
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return null
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTemplateDto: UpdateTemplateDto) {
    return this.templatesService.update(+id, updateTemplateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.templatesService.remove(+id);
  }
}
