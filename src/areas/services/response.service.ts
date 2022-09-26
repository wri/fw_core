import { Injectable } from "@nestjs/common";
import { IUser } from "../../common/user.model";
import { IArea } from "../models/area.entity";
import { GeostoreService } from "./geostore.service";
import config = require('config');
import { CoverageService } from "./coverage.service";
import { DatasetService } from "./dataset.service";

const ALERTS_SUPPORTED = config.get("alertsSupported");

@Injectable()
export class ResponseService {
    constructor(
        private readonly geostoreService: GeostoreService,
        private readonly coverageService: CoverageService,
        private readonly datasetService: DatasetService
        ) { }
async buildAreasResponse(areas: IArea[], objects, user: IUser) {
    const { geostoreObj, coverageObj } = objects;
    const areasWithGeostore = areas.filter(area => area.attributes.geostore);
    const promises = [];
/*     const templatesHash = {}; TODO templates for areas

    let templatesData = [];
    for await (const area of areasWithGeostore) {
      const templateIds = await AreaTemplateRelationService.getAllTemplatesForArea(area.id);
      let templates = [];
      for await (const id of templateIds) {
        if (!templatesHash[id]) templatesHash[id] = await TemplatesService.getTemplate(id);
        templates.push(templatesHash[id]);
      }
      templatesData.push(templates);
    } */

    if (!geostoreObj) {
      promises.push(Promise.all(areasWithGeostore.map(area => this.geostoreService.getGeostore(area.attributes.geostore, user.token))));
    }
    if (!coverageObj) {
      promises.push(
        Promise.all(
          areasWithGeostore.map(area => {
            const params = {
              geostoreId: area.attributes.geostore,
              slugs: ALERTS_SUPPORTED
            };
            return this.coverageService.getCoverage(params, user.token);
          })
        )
      );
    }
    try {
      const [geostoreData, coverageData] = await Promise.all(promises);
      return areasWithGeostore.map((area, index) => {
        let geostore, coverage;

        if(geostoreObj) geostore = geostoreObj;
        else if (geostoreData && geostoreData[index]) geostore = geostoreData[index];
        else geostore = {};

        if(coverageObj) coverage = coverageObj.layers;
        else if (coverageData && coverageData[index]) coverage = coverageData[index].layers;
        else coverage = [];

        //const reportTemplate = templatesData[index] || null; TODO templates
        const datasets = this.datasetService.getDatasetsWithCoverage(area.attributes.datasets, coverage);
        return {
          ...area,
          attributes: {
            ...area.attributes,
            geostore,
            datasets,
            coverage,
            //reportTemplate TODO templates
          }
        };
      });
    } catch (error) {
      throw error;
    }
    }
}