import { Injectable } from '@nestjs/common';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { Template, TemplateDocument } from './models/template.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class TemplatesService {
  constructor(
    @InjectModel('reports', 'formsDb')
    private templateModel: Model<TemplateDocument>,
  ) {}

  async create(
    createTemplateDto: CreateTemplateDto,
  ): Promise<TemplateDocument> {
    const template = await new this.templateModel(createTemplateDto).save();
    return template;
  }

  findAll() {
    return `This action returns all templates`;
  }

  async find(filter): Promise<TemplateDocument[]> {
    return await this.templateModel.find(filter);
  }

  async findOne(filter): Promise<TemplateDocument> {
    return await this.templateModel.findOne(filter);
  }

  async delete(filter): Promise<void> {
    await this.templateModel.deleteMany(filter);
  }

  getTemplate(id: string) {
    return `This action returns a #${id} template`;
  }

  async update(
    id: string,
    updateTemplateDto: UpdateTemplateDto,
  ): Promise<TemplateDocument> {
    const template = await this.templateModel.findById(id);
    if (updateTemplateDto.name) template.name = updateTemplateDto.name;
    if (updateTemplateDto.status) template.status = updateTemplateDto.status;
    if (updateTemplateDto.languages)
      template.languages = updateTemplateDto.languages;
    if (updateTemplateDto.public) template.public = updateTemplateDto.public;
    const savedTemplate = await template.save();
    return savedTemplate;
  }

  remove(id: number) {
    return `This action removes a #${id} template`;
  }

  async getAllPublicTemplateIds(): Promise<string[]> {
    const templates = await this.templateModel.find({ public: true });
    return templates.map((template) => template.id);
  }
}
