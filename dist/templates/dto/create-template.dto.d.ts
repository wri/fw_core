import { ETemplateStatus } from "../models/template.schema";
export declare class CreateTemplateDto {
    name: string;
    questions: [];
    languages: [];
    status: ETemplateStatus;
    public?: boolean;
    defaultLanguage: string;
    user: string;
}
