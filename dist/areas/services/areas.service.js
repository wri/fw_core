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
var AreasService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AreasService = void 0;
const common_1 = require("@nestjs/common");
const geostore_service_1 = require("./geostore.service");
const common_2 = require("@nestjs/common");
const config = require("config");
const fs_1 = __importDefault(require("fs"));
const form_data_1 = __importDefault(require("form-data"));
const axios_1 = __importDefault(require("axios"));
const coverage_service_1 = require("./coverage.service");
const dataset_service_1 = require("./dataset.service");
const ALERTS_SUPPORTED = config.get("alertsSupported");
let AreasService = AreasService_1 = class AreasService {
    constructor(geostoreService, coverageService, datasetService) {
        this.geostoreService = geostoreService;
        this.coverageService = coverageService;
        this.datasetService = datasetService;
        this.logger = new common_2.Logger(AreasService_1.name);
    }
    getArea(areaId, user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const baseURL = config.get("areasAPI.url");
                const url = `${baseURL}/v2/area/${areaId}`;
                const getAreasRequestConfig = {
                    headers: {
                        authorization: user.token
                    }
                };
                const { data } = yield axios_1.default.get(url, getAreasRequestConfig);
                this.logger.log(`Got area with id ${data.data.id}`);
                return data && data.data;
            }
            catch (e) {
                this.logger.error("Error while fetching area", e);
                throw e;
            }
        });
    }
    getAreaMICROSERVICE(areaId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const baseURL = config.get("areasAPI.url");
                const url = `${baseURL}/v1/area/${areaId}`;
                const getAreasRequestConfig = {
                    headers: {
                        authorization: `Bearer ${config.get("service.token")}`
                    }
                };
                const { data } = yield axios_1.default.get(url, getAreasRequestConfig);
                this.logger.log(`Got area with id ${data.data.id}`);
                return data && data.data;
            }
            catch (e) {
                this.logger.error("Error while fetching area", e);
                throw e;
            }
        });
    }
    getUserAreas(user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const baseURL = config.get("areasAPI.url");
                const url = `${baseURL}/v2/area`;
                const getUserAreasRequestConfig = {
                    headers: {
                        authorization: user.token
                    }
                };
                const response = yield axios_1.default.get(url, getUserAreasRequestConfig);
                const areas = response.data;
                this.logger.log(`Got ${areas.data.length} user areas for user ${user.id}`);
                return areas && areas.data;
            }
            catch (e) {
                this.logger.error("Error while fetching areas", e);
                throw e;
            }
        });
    }
    createAreaWithGeostore({ name, image }, geojson, user) {
        return __awaiter(this, void 0, void 0, function* () {
            let geostore;
            let coverage;
            try {
                geostore = yield this.geostoreService.createGeostore(geojson, user);
            }
            catch (error) {
                this.logger.error("Error while creating geostore", error);
            }
            try {
                const params = {
                    geostoreId: geostore.id,
                    slugs: ALERTS_SUPPORTED
                };
                coverage = yield this.coverageService.getCoverage(params, user);
            }
            catch (error) {
                this.logger.error("Error while getting area coverage", error);
                throw error;
            }
            try {
                const form = new form_data_1.default();
                form.append("name", name);
                form.append("geostore", geostore.id);
                form.append("image", fs_1.default.createReadStream(image.path));
                const baseURL = config.get('areasAPI.url');
                const url = `${baseURL}/v1/area/fw/${user.id}`;
                const createAreaRequestConfig = {
                    headers: Object.assign(Object.assign({}, form.getHeaders()), { authorization: user.token })
                };
                const { data } = yield axios_1.default.post(url, form, createAreaRequestConfig);
                return { geostore, area: data.data, coverage };
            }
            catch (error) {
                this.logger.error("Error while creating area with geostore", error);
                throw error;
            }
        });
    }
    updateAreaWithGeostore({ name, image }, geojson, existingArea, user) {
        return __awaiter(this, void 0, void 0, function* () {
            let geostoreId;
            let coverage;
            if (geojson) {
                try {
                    const geostoreResponse = yield this.geostoreService.createGeostore(geojson, user.token);
                    geostoreId = geostoreResponse.id;
                }
                catch (e) {
                    this.logger.error("Error while creating geostore", e);
                    throw e;
                }
            }
            else
                geostoreId = existingArea.attributes.geostore;
            try {
                const params = {
                    geostoreId,
                    slugs: ALERTS_SUPPORTED
                };
                coverage = yield this.coverageService.getCoverage(params, user.token);
            }
            catch (e) {
                this.logger.error("Error while getting area coverage", e);
                throw e;
            }
            try {
                const form = new form_data_1.default();
                if (name)
                    form.append("name", name);
                form.append("geostore", geostoreId);
                if (image)
                    form.append("image", fs_1.default.createReadStream(image.path));
                const baseURL = config.get('areasAPI.url');
                const url = `${baseURL}/v2/area/${existingArea.id}`;
                const createAreaRequestConfig = {
                    headers: Object.assign(Object.assign({}, form.getHeaders()), { authorization: user.token })
                };
                const { data } = yield axios_1.default.patch(url, form, createAreaRequestConfig);
                this.logger.log(`Updated area with id ${data.data.id}`);
                return { geostoreId, area: data.data, coverage };
            }
            catch (e) {
                this.logger.error("Error while updating area with geostore", e);
                throw e;
            }
        });
    }
    delete(areaId, user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const baseURL = config.get('areasAPI.url');
                const url = `${baseURL}/v2/area/${areaId}`;
                const deleteAreaRequestConfig = {
                    headers: {
                        authorization: user.token
                    }
                };
                const { data } = yield axios_1.default.delete(url, deleteAreaRequestConfig);
                const area = data.data;
                this.logger.log(`Area with id ${area.id} deleted`);
                return area;
            }
            catch (error) {
                this.logger.error("Error while deleting area", error);
                throw error;
            }
        });
    }
};
AreasService = AreasService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [geostore_service_1.GeostoreService,
        coverage_service_1.CoverageService,
        dataset_service_1.DatasetService])
], AreasService);
exports.AreasService = AreasService;
//# sourceMappingURL=areas.service.js.map