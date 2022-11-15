import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TemplatesService } from '../../templates/templates.service';
import { IArea } from '../models/area.entity';
import { TemplateAreaRelationDocument } from '../models/templateAreaRelation.schema';
import { AreasService } from './areas.service';

@Injectable()
export class TemplateAreaRelationService {
  constructor(
    @InjectModel('areatemplaterelations', 'apiDb')
    private templateAreaRelationModel: Model<TemplateAreaRelationDocument>,
    private templateService: TemplatesService,
    private areasService: AreasService,
  ) {}

  async create({ areaId, templateId }): Promise<TemplateAreaRelationDocument> {
    if (await this.templateAreaRelationModel.findOne({ areaId, templateId }))
      throw new HttpException(
        'Relation already exists',
        HttpStatus.BAD_REQUEST,
      );

    const newRelation = new this.templateAreaRelationModel({
      areaId,
      templateId,
    });
    return await newRelation.save();
  }

  async find(filter): Promise<TemplateAreaRelationDocument[]> {
    return await this.templateAreaRelationModel.find(filter);
  }

  async findTemplatesForArea(areaId: string): Promise<string[]> {
    const areaTemplates = await this.templateAreaRelationModel.find({ areaId });
    const areaTemplateIds = areaTemplates.map(
      (template) => template.templateId,
    );
    const publicTemplates = await this.templateService.findAllPublicTemplates({
      projection: ['_id'],
    });
    const publicTemplatesIds = publicTemplates.map<string>((t) => t.id);

    publicTemplatesIds.forEach((id) => {
      if (!areaTemplateIds.includes(id)) areaTemplateIds.push(id);
    });
    return areaTemplateIds;
  }

  async findAreasForTemplate(
    templateId: string,
  ): Promise<{ id: string | undefined; name: string | undefined }[]> {
    const relations = await this.templateAreaRelationModel.find({ templateId });

    const areas = await Promise.all(
      relations.map((relation) =>
        this.areasService.getAreaMICROSERVICE(relation.areaId),
      ),
    );

    return areas
      .filter((a): a is IArea => a !== null)
      .map((area) => {
        return { id: area?.id, name: area?.attributes.name };
      });
  }

  async deleteMany(filter): Promise<void> {
    await this.templateAreaRelationModel.deleteMany(filter);
  }
}
