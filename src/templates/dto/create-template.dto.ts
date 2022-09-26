import { IsDefined, IsNotEmpty } from "class-validator";

export class CreateTemplateDto {
    @IsDefined()
    @IsNotEmpty()
    name: string;
    @IsDefined()
    @IsNotEmpty()
    geojson: string;
}
