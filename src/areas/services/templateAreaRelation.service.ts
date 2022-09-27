import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from 'mongoose';
import { TemplateAreaRelation, TemplateAreaRelationDocument } from "../models/templateAreaRelation.schema";

@Injectable()
export class TemplateAreaRelationService {

    constructor(
        @InjectModel(TemplateAreaRelation.name, 'apiDb') private templateAreaRelationModel: Model<TemplateAreaRelationDocument>
        ) { }

    async create({areaId, templateId}): Promise<TemplateAreaRelationDocument> {
        if(await this.templateAreaRelationModel.findOne({areaId, templateId})) throw new HttpException("Relation already exists", HttpStatus.BAD_REQUEST);
        const newRelation = new this.templateAreaRelationModel({areaId, templateId});
        return await newRelation.save();
    }

    async find(filter): Promise<TemplateAreaRelationDocument[]> {
        return await this.templateAreaRelationModel.find(filter);
    }

    async delete(filter): Promise<void> {
       await this.templateAreaRelationModel.deleteMany(filter);
    }
}