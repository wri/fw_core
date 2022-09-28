import { Injectable } from '@nestjs/common';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { Template, TemplateDocument } from './models/template.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class TemplatesService {
  constructor(
    @InjectModel(Template.name, 'formsDb') private templateModel: Model<TemplateDocument>
) { }

  async create(createTemplateDto: CreateTemplateDto): Promise<TemplateDocument> {
    const template = await new this.templateModel(createTemplateDto).save();
    return template
  }

  findAll() {
    return `This action returns all templates`;
  }

  async find(filter): Promise<TemplateDocument[]> {
    return await this.templateModel.find(filter);
  }

  async findOne(filter): Promise<TemplateDocument> {
    return await this.templateModel.findOne(filter)
  }

  getTemplate(id: string) {
    return `This action returns a #${id} template`;
  }

  update(id: number, updateTemplateDto: UpdateTemplateDto) {
    return `This action updates a #${id} template`;
  }

  remove(id: number) {
    return `This action removes a #${id} template`;
  }
}
