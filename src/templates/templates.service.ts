import { Injectable } from '@nestjs/common';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { ETemplateStatus, TemplateDocument } from './models/template.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { BaseService } from '../common/base.service';
import { MongooseObjectId } from '../common/objectId';

@Injectable()
export class TemplatesService extends BaseService<
  TemplateDocument,
  CreateTemplateDto,
  UpdateTemplateDto
> {
  constructor(
    @InjectModel('reports', 'formsDb')
    templateModel: Model<TemplateDocument>,
  ) {
    super(TemplatesService.name, templateModel);
  }

  /**
   * Finds all the templates that belong to a certain edit group
   * @param id Edit group id
   * @returns A list of Template documents that belong to the edit group
   */
  async findAllByEditGroupId(
    id: string | MongooseObjectId,
    opts?: Partial<{ user: string }>,
  ): Promise<TemplateDocument[]> {
    const filter: mongoose.FilterQuery<TemplateDocument> = { editGroupId: id };

    if (opts?.user) {
      filter.user = opts.user;
    }

    return this.model.find(filter);
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

    return this.model.find(filter);
  }

  async findOne(
    filter: mongoose.FilterQuery<TemplateDocument>,
  ): Promise<TemplateDocument | null> {
    return await this.model.findOne(filter);
  }

  async getAllPublicTemplateIds(): Promise<string[]> {
    const templates = await this.model.find({ public: true });
    return templates.map((template) => template.id);
  }
}
