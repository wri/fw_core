import { ConfigService } from "@nestjs/config";
export declare class S3Service {
    private readonly configService;
    constructor(configService: ConfigService);
    getExtension(name: any): any;
    uploadFile(filePath: any, name: any): Promise<unknown>;
}
