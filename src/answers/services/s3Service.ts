import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import AWS from 'aws-sdk';
import fs from 'fs/promises';
import { v4 } from 'uuid';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class S3Service {
  private readonly s3: AWS.S3;
  private readonly S3_BUCKET: string;
  private readonly S3_FOLDER: string;
  private readonly PRESIGNED_URL_EXPIRY_SECONDS = 60 * 5;
  private readonly s3Client: S3Client;

  constructor(configService: ConfigService) {
    AWS.config.update({
      accessKeyId: configService.getOrThrow('s3.accessKeyId'),
      secretAccessKey: configService.getOrThrow('s3.secretAccessKey'),
    });

    this.S3_BUCKET = configService.getOrThrow('s3.bucket');
    this.S3_FOLDER = configService.getOrThrow('s3.folder');

    this.s3 = new AWS.S3();

    this.s3Client = new S3Client({
      credentials: {
        accessKeyId: configService.getOrThrow('s3.accessKeyId'),
        secretAccessKey: configService.getOrThrow('s3.secretAccessKey'),
      },
    });
  }

  getExtension(fullFilename: string): string | undefined {
    return fullFilename.split('.').slice(-1)[0];
  }

  async uploadFile(opts: {
    filePath: string;
    fullFileName: string;
    isPublic?: boolean;
  }): Promise<string> {
    const ext = this.getExtension(opts.fullFileName);
    const data = await fs.readFile(opts.filePath);
    const buffer = Buffer.from(data);
    const uuid = v4();

    const uploadParams: AWS.S3.PutObjectRequest = {
      Bucket: this.S3_BUCKET,
      Key: `${this.S3_FOLDER}/${uuid}.${ext}`,
      Body: buffer,
      ACL: opts.isPublic ? 'public-read' : 'private',
    };

    const upload = await this.s3.upload(uploadParams).promise();
    return upload.Location;
  }

  async generatePresignedUrl(input: {
    key: string;
    expiry?: number;
  }): Promise<string> {
    const expires = input.expiry ?? this.PRESIGNED_URL_EXPIRY_SECONDS;
    const splitArray = input.key.split(this.S3_FOLDER);

    if (splitArray.length < 2) return input.key;

    const getObjectCommand = new GetObjectCommand({
      Bucket: this.S3_BUCKET,
      Key: `${this.S3_FOLDER}${splitArray[splitArray.length - 1]}`,
    });

    //return this.s3.getSignedUrl('putObject', params);
    return getSignedUrl(this.s3Client, getObjectCommand, {
      expiresIn: expires,
    });
  }

  async updateFile(opts: { url: string; isPublic: boolean }): Promise<void> {
    const uploadParams: AWS.S3.PutObjectRequest = {
      Bucket: this.S3_BUCKET,
      Key: opts.url,
      ACL: opts.isPublic ? 'public-read' : 'private',
    };

    await this.s3.putObjectAcl(uploadParams).promise();
    return;
  }
}
