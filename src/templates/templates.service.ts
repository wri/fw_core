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
    opts?: Partial<{ user: string; latest: boolean }>,
  ): Promise<TemplateDocument[]> {
    const filter: mongoose.FilterQuery<TemplateDocument> = { editGroupId: id };

    if (opts?.user) {
      filter.user = opts.user;
    }

    if (opts?.latest) {
      filter.isLatest = true;
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
    opts?: Partial<{ latest: boolean; status: ETemplateStatus }>,
  ): Promise<TemplateDocument[]> {
    const filter: mongoose.FilterQuery<TemplateDocument> = { user: id };

    if (opts?.latest === true) {
      filter.isLatest = { $ne: false };
    }

    if (opts?.status) {
      filter.status = opts.status;
    }

    return this.model.find(filter);
  }

  async findOne(
    filter: mongoose.FilterQuery<TemplateDocument>,
  ): Promise<TemplateDocument | null> {
    return await this.model.findOne(filter);
  }

  /**
   * Fetch a list of all documents that are public
   * @param opts A list of additional options
   * - A list of template keys that should be included in the response
   * @returns A list of public documents
   */
  async findAllPublicTemplates(opts?: {
    projection: (keyof TemplateDocument)[];
  }): Promise<TemplateDocument[]> {
    if (opts?.projection) {
      return this.model.find(
        { public: true, status: ETemplateStatus.PUBLISHED },
        { projection: opts.projection },
      );
    }
    return this.model.find({
      public: true,
      status: ETemplateStatus.PUBLISHED,
    });
  }

  async deleteAllVersions(id, editGroupId): Promise<void> {
    await this.model.deleteMany({ editGroupId });
    await this.model.findByIdAndDelete(id);
  }

  async updateId(oldId) {
    const doc = await this.model.findById(oldId);
    if (doc) {
      const newDoc = new this.model({
        name: doc.name,
        user: doc.user,
        languages: doc.languages,
        defaultLanguage: doc.defaultLanguage,
        public: doc.public,
        status: doc.status,
        createdAt: doc.createdAt,
        questions: doc.questions,
        editGroupId: doc.editGroupId,
        isLatest: doc.isLatest,
        _id: new mongoose.Types.ObjectId('59b6a26b138f260012e9fdeb'),
      });
      const savedDoc = await newDoc.save();
      //await this.model.findByIdAndDelete(oldId);
      return savedDoc;
    } else return;
  }
}
