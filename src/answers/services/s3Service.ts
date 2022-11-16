import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import AWS from 'aws-sdk';
import fs from 'fs/promises';
import { v4 } from 'uuid';

@Injectable()
export class S3Service {
  private readonly s3: AWS.S3;
  private readonly S3_BUCKET: string;
  private readonly S3_FOLDER: string;
  constructor(configService: ConfigService) {
    AWS.config.update({
      accessKeyId: configService.getOrThrow('s3.accessKeyId'),
      secretAccessKey: configService.getOrThrow('s3.secretAccessKey'),
    });

    this.S3_BUCKET = configService.getOrThrow('s3.bucket');
    this.S3_FOLDER = configService.getOrThrow('s3.folder');

    this.s3 = new AWS.S3();
  }

  getExtension(fullFilename: string): string | undefined {
    return fullFilename.split('.').slice(-1)[0];
  }

  async uploadFile(filePath: string, fullFileName: string): Promise<string> {
    const ext = this.getExtension(fullFileName);
    const data = await fs.readFile(filePath);
    const buffer = Buffer.from(data);
    const uuid = v4();

    const uploadParams: AWS.S3.PutObjectRequest = {
      Bucket: this.S3_BUCKET,
      Key: `${this.S3_FOLDER}/${uuid}.${ext}`,
      Body: buffer,
      ACL: 'public-read',
    };

    const upload = await this.s3.upload(uploadParams).promise();
    return upload.Location;
  }
}
