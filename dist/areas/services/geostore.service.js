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
var GeostoreService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeostoreService = void 0;
const common_1 = require("@nestjs/common");
const config = require("config");
const axios_1 = __importDefault(require("axios"));
const common_2 = require("@nestjs/common");
const redisClient_1 = __importDefault(require("../../common/redisClient"));
const deserlializer_1 = __importDefault(require("../../common/deserlializer"));
let GeostoreService = GeostoreService_1 = class GeostoreService {
    constructor() {
        this.logger = new common_2.Logger(GeostoreService_1.name);
    }
    createGeostore(geojson, token) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const baseURL = config.get("geostoreAPI.url");
                const url = `${baseURL}/geostore`;
                const body = {
                    geojson,
                    lock: true
                };
                const createGeostoreRequestConfig = {
                    headers: {
                        authorization: token
                    }
                };
                const { data } = yield axios_1.default.post(url, body, createGeostoreRequestConfig);
                return data && (0, deserlializer_1.default)(data.data);
            }
            catch (error) {
                this.logger.error("Error while creating geostore", error);
            }
        });
    }
    getGeostore(geostoreId, token) {
        return __awaiter(this, void 0, void 0, function* () {
            let geostore = yield redisClient_1.default.get(geostoreId.toString());
            if (!geostore) {
                try {
                    const baseURL = config.get("geostoreAPI.url");
                    const url = `${baseURL}/geostore/${geostoreId}`;
                    const getGeostoreRequestConfig = {
                        headers: {
                            authorization: token
                        }
                    };
                    const { data } = yield axios_1.default.get(url, getGeostoreRequestConfig);
                    geostore = (0, deserlializer_1.default)(data.data);
                    redisClient_1.default.set(geostoreId.toString(), geostore, 'EX', 7 * 60 * 60 * 24);
                }
                catch (error) {
                    this.logger.error("Error while fetching geostore", error);
                    throw error;
                }
            }
            return geostore;
        });
    }
};
GeostoreService = GeostoreService_1 = __decorate([
    (0, common_1.Injectable)()
], GeostoreService);
exports.GeostoreService = GeostoreService;
//# sourceMappingURL=geostore.service.js.map