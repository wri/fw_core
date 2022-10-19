import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { TemplateDocument } from './models/template.schema';
import { Model } from 'mongoose';
export declare class TemplatesService {
    private templateModel;
    constructor(templateModel: Model<TemplateDocument>);
    create(createTemplateDto: CreateTemplateDto): Promise<TemplateDocument>;
    findAll(): string;
    find(filter: any): Promise<TemplateDocument[]>;
    findOne(filter: any): Promise<TemplateDocument>;
    delete(filter: any): Promise<void>;
    getTemplate(id: string): string;
    update(id: string, updateTemplateDto: UpdateTemplateDto): Promise<TemplateDocument>;
    remove(id: number): string;
}
