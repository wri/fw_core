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
  ParseArrayPipe,
  NotFoundException,
} from '@nestjs/common';
import { AreasService } from '../services/areas.service';
import { CreateTemplateAreaRelationDto } from '../dto/createTemplateAreaRelation.dto';
import { TemplatesService } from '../../templates/templates.service';
import { TemplateAreaRelationService } from '../services/templateAreaRelation.service';
import { TemplateAreaRelationDocument } from '../models/templateAreaRelation.schema';
import { CreateTemplateAreaRelationInput } from '../input/create-template-area-relation.input';

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
    @Body(new ParseArrayPipe({ items: CreateTemplateAreaRelationInput }))
    body: CreateTemplateAreaRelationInput[],
  ): Promise<TemplateAreaRelationDocument[]> {
    if (body.length === 0) return [];

    for (const relation of body) {
      const area = await this.areasService.getAreaMICROSERVICE(relation.areaId);
      if (!area)
        throw new NotFoundException(`Area ${relation.areaId} doesnt exist`);

      const team = await this.templatesService.findById(relation.templateId);
      if (!team)
        throw new NotFoundException(`Team ${relation.templateId} doesnt exist`);
    }

    const relations = body.map((relation) =>
      this.templateAreaRelationService.create(relation),
    );

    return Promise.all(relations);
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

  // GET /arearelations/templates/templateAreas/:templateId
  // Returns array of area ids linked to template
  @Get('/templateAreas/:templateId')
  async getAllAreasForTeam(
    @Param('templateId') templateId: string,
  ): Promise<string[]> {
    const template = await this.templatesService.findById(templateId);
    if (!template)
      throw new HttpException("Template doesn't exist", HttpStatus.NOT_FOUND);
    const relations = await this.templateAreaRelationService.find({
      templateId,
    });
    return relations.map((relation) => relation.areaId);
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
