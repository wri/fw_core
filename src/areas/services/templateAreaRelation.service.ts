import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TemplatesService } from '../../templates/templates.service';
import {
  TemplateAreaRelation,
  TemplateAreaRelationDocument,
} from '../models/templateAreaRelation.schema';

@Injectable()
export class TemplateAreaRelationService {
  constructor(
    @InjectModel('areatemplaterelations', 'apiDb')
    private templateAreaRelationModel: Model<TemplateAreaRelationDocument>,
    private templateService: TemplatesService,
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
    const publicTemplates =
      await this.templateService.getAllPublicTemplateIds();
    publicTemplates.forEach((id) => {
      if (!areaTemplateIds.includes(id)) areaTemplateIds.push(id);
    });
    return areaTemplateIds;
  }

  async delete(filter): Promise<void> {
    await this.templateAreaRelationModel.deleteMany(filter);
  }
}
