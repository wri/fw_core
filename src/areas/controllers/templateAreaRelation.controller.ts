import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Logger,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { AreasService } from '../services/areas.service';
import { CreateTemplateAreaRelationDto } from '../dto/createTemplateAreaRelation.dto';
import { TemplatesService } from '../../templates/templates.service';
import { TemplateAreaRelationService } from '../services/templateAreaRelation.service';
import { TemplateAreaRelationDocument } from '../models/templateAreaRelation.schema';

@Controller('arearelations/templates')
export class TemplateAreaRelationController {
  constructor(
    private readonly areasService: AreasService,
    private readonly templatesService: TemplatesService,
    private readonly templateAreaRelationService: TemplateAreaRelationService,
  ) {}

  private readonly logger = new Logger(TemplateAreaRelationController.name);

  @Post()
  async createTemplateAreaRelation(
    @Body() body: CreateTemplateAreaRelationDto,
  ): Promise<TemplateAreaRelationDocument> {
    const area = await this.areasService.getAreaMICROSERVICE(body.areaId);
    if (!area)
      throw new HttpException("Area doesn't exist", HttpStatus.NOT_FOUND);
    const template = await this.templatesService.findById(body.templateId);
    if (!template)
      throw new HttpException("Template doesn't exist", HttpStatus.NOT_FOUND);
    return await this.templateAreaRelationService.create(body);
  }

  @Delete()
  async deleteTemplateAreaRelation(
    @Body() body: CreateTemplateAreaRelationDto,
  ): Promise<void> {
    await this.templateAreaRelationService.deleteMany(body);
  }

  // INTERNAL USE ONLY
  // GET /areas/templates/areaTemplates/:areaId
  // Returns array of template ids linked to area
  @Get('/areaTemplates/:areaId')
  async getAllTemplatesForArea(
    @Param('areaId') areaId: string,
  ): Promise<string[]> {
    const area = await this.areasService.getAreaMICROSERVICE(areaId);
    if (!area)
      throw new HttpException("Area doesn't exist", HttpStatus.NOT_FOUND);
    const relations = await this.templateAreaRelationService.find({ areaId });
    const publicRelations = await this.templatesService.findAllPublicTemplates({
      projection: ['_id'],
    });
    const publicRelationsIds = publicRelations.map<string>((t) => t.id);

    const relationIds = relations.map((relation) => relation.templateId);
    publicRelationsIds.forEach((id) => {
      if (!relationIds.includes(id)) relationIds.push(id);
    });
    return relationIds;
  }

  // INTERNAL USE ONLY
  @Delete('/deleteAllForTemplate/:templateId')
  deleteAllTemplateRelations(@Param('templateId') templateId: string): void {
    this.templateAreaRelationService.deleteMany({ templateId });
  }

  // INTERNAL USE ONLY
  @Delete('/deleteAllForArea/:areaId')
  deleteAllAreaRelations(@Param('areaId') areaId: string): void {
    this.templateAreaRelationService.deleteMany({ areaId });
  }
}
