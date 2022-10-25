import { Injectable } from '@nestjs/common';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import {
  ETemplateStatus,
  Template,
  TemplateDocument,
} from './models/template.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import mongoose from 'mongoose';

@Injectable()
export class TemplatesService {
  constructor(
    @InjectModel('reports', 'formsDb')
    private templateModel: Model<TemplateDocument>,
  ) {}

  async create(
    createTemplateDto: CreateTemplateDto,
  ): Promise<TemplateDocument> {
    const template = new this.templateModel(createTemplateDto);
    return template.save();
  }

  findAll() {
    return `This action returns all templates`;
  }

  async find(filter): Promise<TemplateDocument[]> {
    return await this.templateModel.find(filter);
  }

  /**
   * Finds all the templates that belong to a certain edit group
   * @param id Edit group id
   * @returns A list of Template documents that belong to the edit group
   */
  async findAllByEditGroupId(
    id: string,
    opts?: Partial<{ user: string }>,
  ): Promise<TemplateDocument[]> {
    const filter: mongoose.FilterQuery<TemplateDocument> = { editGroupId: id };

    if (opts?.user) {
      filter.user = opts.user;
    }

    return this.templateModel.find(filter);
  }

  /**
   * Find all the templates created by a user
   * @param id User id of the owner of the templates
   * @param opts Additional options
   * - `latest`: Fetches only the latest version of the the templates if true
   * - `unpublished`: Fetches also the unpublished templates if true
   * @returns A list of Template documents owner by the user
   */
  async findAllByUserId(
    id: string,
    opts?: Partial<{ latest: boolean; unpublished: boolean }>,
  ): Promise<TemplateDocument[]> {
    const filter: mongoose.FilterQuery<TemplateDocument> = { user: id };

    if (opts?.latest === true) {
      filter.isLatest = true;
    }

    if (opts?.unpublished !== true) {
      filter.status = ETemplateStatus.PUBLISHED;
    }

    return this.templateModel.find(filter);
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
