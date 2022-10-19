"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.S3Service = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const aws_sdk_1 = __importDefault(require("aws-sdk"));
const fs_1 = __importDefault(require("fs"));
const uuid_1 = require("uuid");
let S3Service = class S3Service {
    constructor(configService) {
        this.configService = configService;
    }
    getExtension(name) {
        const parts = name.split(".");
        return parts[parts.length - 1];
    }
    uploadFile(filePath, name) {
        return __awaiter(this, void 0, void 0, function* () {
            aws_sdk_1.default.config.update({
                accessKeyId: this.configService.get("s3.accessKeyId"),
                secretAccessKey: this.configService.get("s3.secretAccessKey")
            });
            const s3 = new aws_sdk_1.default.S3();
            const ext = this.getExtension(name);
            return new Promise((resolve, reject) => {
                fs_1.default.readFile(filePath, (err, data) => {
                    if (err) {
                        reject(err);
                    }
                    const uuid = (0, uuid_1.v4)();
                    const base64data = Buffer.from(data);
                    s3.upload({
                        Bucket: this.configService.get("s3.bucket"),
                        Key: `${this.configService.get("s3.folder")}/${uuid}.${ext}`,
                        Body: base64data,
                        ACL: "public-read"
                    }, resp => {
                        if (resp) {
                            reject(resp);
                            return;
                        }
                        resolve(`https://s3.amazonaws.com/${this.configService.get("s3.bucket")}/${this.configService.get("s3.folder")}/${uuid}.${ext}`);
                    });
                });
            });
        });
    }
};
S3Service = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], S3Service);
exports.S3Service = S3Service;
//# sourceMappingURL=s3Service.js.map