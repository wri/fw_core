"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
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
var UserService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = __importDefault(require("axios"));
const config = require("config");
const redisClient_1 = __importDefault(require("./redisClient"));
let UserService = UserService_1 = class UserService {
    constructor() {
        this.logger = new common_1.Logger(UserService_1.name);
    }
    authorise(token) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const baseURL = config.get("auth.url");
                const url = `${baseURL}/auth/user/me`;
                const getUserDetailsRequestConfig = {
                    headers: {
                        authorization: token
                    }
                };
                const response = yield axios_1.default.get(url, getUserDetailsRequestConfig);
                this.logger.log(`Received data for user with id ${response.data.id}`);
                return response.data;
            }
            catch (e) {
                throw new common_1.HttpException('Forbidden', common_1.HttpStatus.FORBIDDEN);
            }
        });
    }
    getNameByIdMICROSERVICE(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!userId)
                return null;
            let name = yield redisClient_1.default.get(userId.toString());
            if (!name) {
                try {
                    const baseURL = config.get("auth.url");
                    const url = `${baseURL}/user/${userId}`;
                    const getUserDetailsRequestConfig = {
                        headers: {
                            authorization: `Bearer ${config.get("service.token")}`
                        }
                    };
                    const response = yield axios_1.default.get(url, getUserDetailsRequestConfig);
                    const user = response.data;
                    if (!user || !user.data)
                        return null;
                    const fullName = user.data.attributes.firstName
                        ? `${user.data.attributes.firstName} ${user.data.attributes.lastName}`
                        : user.data.attributes.lastName;
                    this.logger.log(`Received name for user with id ${user.data.id} ${fullName}`);
                    redisClient_1.default.set(userId.toString(), fullName, 'EX', 60 * 60 * 24);
                    return fullName;
                }
                catch (e) {
                    common_1.Logger.error(`Error finding user ${userId}`, e);
                    return null;
                }
            }
            else
                return name;
        });
    }
    getUserFromRequest(request) {
        return Object.assign({}, request.query.loggedUser ? JSON.parse(request.query.loggedUser) : request.body.loggedUser);
    }
};
UserService = UserService_1 = __decorate([
    (0, common_1.Injectable)()
], UserService);
exports.UserService = UserService;
//# sourceMappingURL=user.service.js.map