import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import AWS from "aws-sdk";
import fs from "fs";
import { v4 } from "uuid";

@Injectable()
export class S3Service {

  constructor(
    private readonly configService: ConfigService
  ) { }

  // eslint-disable-next-line class-methods-use-this
  getExtension(name) {
    const parts = name.split(".");
    return parts[parts.length - 1];
  }

  // eslint-disable-next-line require-yield
  async uploadFile(filePath, name) {

    AWS.config.update({
      accessKeyId: this.configService.get("s3.accessKeyId"),
      secretAccessKey: this.configService.get("s3.secretAccessKey")
    });

    const s3 = new AWS.S3();
    const ext = this.getExtension(name);
    return new Promise((resolve, reject) => {
      fs.readFile(filePath, (err, data) => {
        if (err) {
          reject(err);
        }
        const uuid = v4();
        // eslint-disable-next-line no-buffer-constructor
        const base64data = Buffer.from(data);
        s3.upload(
          {
            Bucket: this.configService.get("s3.bucket"),
            Key: `${this.configService.get("s3.folder")}/${uuid}.${ext}`,
            Body: base64data,
            ACL: "public-read"
          },
          resp => {
            if (resp) {
              reject(resp);
              return;
            }
            resolve(`https://s3.amazonaws.com/${this.configService.get("s3.bucket")}/${this.configService.get("s3.folder")}/${uuid}.${ext}`);
          }
        );
      });
    });
  }
}