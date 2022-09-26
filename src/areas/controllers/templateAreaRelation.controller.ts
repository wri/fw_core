import { Controller, Get, Post, Body, Patch, Param, Delete, Req, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { AreasService } from '../services/areas.service';
import { UpdateAreaDto } from '../dto/update-area.dto';
import { TeamsService } from '../../teams/services/teams.service';
import { CreateTemplateAreaRelationDto } from '../dto/createTemplateAreaRelation.dto';
import { TemplatesService } from '../../templates/templates.service';
import { TemplateAreaRelationService } from '../services/templateAreaRelation.service';
import { TemplateAreaRelationDocument } from '../models/templateAreaRelation.schema';

@Controller('forest-watcher/areas/templates')
export class TemplateAreaRelationController {
  constructor(
    private readonly areasService: AreasService,
    private readonly templatesService: TemplatesService,
    private readonly templateAreaRelationService: TemplateAreaRelationService
  ) { }

  private readonly logger = new Logger(TemplateAreaRelationController.name);

  @Post()
  async createTemplateAreaRelation(@Body() body: CreateTemplateAreaRelationDto): Promise<TemplateAreaRelationDocument> {
    const area = await this.areasService.getAreaMICROSERVICE(body.areaId);
    if(!area) throw new HttpException("Area doesn't exist", HttpStatus.NOT_FOUND);
    const template = await this.templatesService.getTemplate(body.templateId);
    if(!template) throw new HttpException("Template doesn't exist", HttpStatus.NOT_FOUND);
    return (await this.templateAreaRelationService.create(body))
  }

  // INTERNAL USE ONLY
  // GET /forest-watcher/areas/templates/areaTemplates/:areaId
  // Returns array of template ids linked to area
  @Get('/areaTemplates/:areaId')
  async getAllTemplatesForArea(@Param('areaId') areaId: string): Promise<string[]> {
    const area = await this.areasService.getAreaMICROSERVICE(areaId);
    if(!area) throw new HttpException("Area doesn't exist", HttpStatus.NOT_FOUND);
    const relations = await this.templateAreaRelationService.find({areaId});
    return relations.map(relation => relation.templateId)
  }

  // INTERNAL USE ONLY
  @Delete('/deleteAllForTemplate/:templateId')
  deleteAllTemplateRelations(@Param('templateId') templateId: string): void {
    this.templateAreaRelationService.delete({templateId})
  }

  // INTERNAL USE ONLY
  @Delete('/deleteAllForArea/:areaId')
  deleteAllAreaRelations(@Param('areaId') areaId: string): void {
    this.templateAreaRelationService.delete({areaId})
  }


}
