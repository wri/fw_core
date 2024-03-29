import { Injectable } from '@nestjs/common';
import { IUser } from '../../common/user.model';
import { IArea } from '../models/area.entity';
import { GeostoreService } from './geostore.service';
import { CoverageService } from './coverage.service';
import { DatasetService } from './dataset.service';
import { TemplateAreaRelationService } from './templateAreaRelation.service';
import { TemplatesService } from '../../templates/templates.service';
import { TeamDocument } from '../../teams/models/team.schema';
import { TeamsService } from '../../teams/services/teams.service';
import { TeamAreaRelationService } from './teamAreaRelation.service';
import { ConfigService } from '@nestjs/config';
import mongoose from 'mongoose';

@Injectable()
export class ResponseService {
  constructor(
    private readonly geostoreService: GeostoreService,
    private readonly coverageService: CoverageService,
    private readonly datasetService: DatasetService,
    private readonly templateAreaRelationService: TemplateAreaRelationService,
    private readonly teamAreaRelationService: TeamAreaRelationService,
    private readonly templatesService: TemplatesService,
    private readonly teamsService: TeamsService,
    private readonly configService: ConfigService,
  ) {}
  async buildAreasResponse(areas: IArea[], objects, user: IUser) {
    const { geostoreObj, coverageObj } = objects;
    const areasWithGeostore = areas.filter((area) => area.attributes.geostore);
    const promises: any[] = [];
    const ALERTS_SUPPORTED = this.configService.get('alertsSupported');

    if (!geostoreObj) {
      const geostorePromises = areasWithGeostore.map((area) => {
        if (typeof area.attributes.geostore !== 'string')
          return area.attributes.geostore;

        return this.geostoreService.getGeostore(
          area.attributes.geostore,
          user.token ?? '',
        );
      });
      promises.push(Promise.all(geostorePromises));
    } else promises.push([geostoreObj]);
    if (!coverageObj) {
      promises.push(
        Promise.all(
          areasWithGeostore.map((area) => {
            const params = {
              geostoreId: area.attributes.geostore,
              slugs: ALERTS_SUPPORTED,
            };
            return this.coverageService.getCoverage(params, user.token ?? '');
          }),
        ),
      );
    } else promises.push([coverageObj]);
    promises.push(
      Promise.all(
        areasWithGeostore.map(async (area) => {
          const templateIds =
            await this.templateAreaRelationService.findTemplatesForArea(
              area.id,
            );
          return this.templatesService.find({
            _id: {
              $in: templateIds.map(
                (templateId) => new mongoose.Types.ObjectId(templateId),
              ),
            },
          });
        }),
      ),
    );
    const userTeams: TeamDocument[] = await this.teamsService.findAllByUserId(
      user.id,
    ); // get list of user's teams
    promises.push(
      Promise.all(
        areasWithGeostore.map(async (area) => {
          const areaTeams: string[] =
            await this.teamAreaRelationService.getAllTeamsForArea(area.id); // get list of teams associated with area
          const filteredTeams: TeamDocument[] = userTeams.filter((userTeam) =>
            areaTeams.includes(userTeam.id),
          ); // match area teams to user teams
          return filteredTeams.map((filteredTeam) => {
            return { id: filteredTeam.id, name: filteredTeam.name };
          });
        }),
      ),
    );

    try {
      const [geostoreData, coverageData, templateData, teamData] =
        await Promise.all(promises);
      return areasWithGeostore.map((area, index) => {
        let geostore, coverage;

        if (geostoreObj) geostore = geostoreObj;
        else if (geostoreData && geostoreData[index])
          geostore = geostoreData[index];
        else geostore = {};

        if (coverageObj) coverage = coverageObj.layers;
        else if (coverageData && coverageData[index])
          coverage = coverageData[index].layers;
        else coverage = [];

        const datasets = this.datasetService.getDatasetsWithCoverage(
          area.attributes.datasets,
          coverage,
        );
        return {
          ...area,
          attributes: {
            ...area.attributes,
            geostore,
            datasets,
            coverage,
            reportTemplate: templateData[index],
            teams: teamData[index],
          },
        };
      });
    } catch (error) {
      throw error;
    }
  }
}
