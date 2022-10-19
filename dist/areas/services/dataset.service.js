"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatasetService = void 0;
const common_1 = require("@nestjs/common");
const moment_1 = __importDefault(require("moment"));
const globalAlerts = [
    {
        slug: "viirs",
        name: "VIIRS",
        active: false,
        startDate: "1",
        endDate: "8"
    }
];
let DatasetService = class DatasetService {
    getDatasetsWithActive(datasets) {
        if (!(datasets.length > 0) || datasets.find(d => d.active))
            return datasets;
        datasets[0].active = true;
        return datasets;
    }
    getDatasetsWithCoverage(list, layers) {
        const datasets = !list || list.length === 0 ? globalAlerts : list;
        const glad = {
            slug: "umd_as_it_happens",
            name: "GLAD",
            active: false,
            startDate: 6,
            endDate: (0, moment_1.default)().format("YYYYMMDD")
        };
        const areaHasGlad = layers.includes(glad.slug);
        const datasetsHasGlad = datasets.find(dataset => dataset.slug === glad.slug);
        if (areaHasGlad && !datasetsHasGlad) {
            return this.getDatasetsWithActive([glad, ...datasets]);
        }
        return this.getDatasetsWithActive(datasets);
    }
};
DatasetService = __decorate([
    (0, common_1.Injectable)()
], DatasetService);
exports.DatasetService = DatasetService;
//# sourceMappingURL=dataset.service.js.map