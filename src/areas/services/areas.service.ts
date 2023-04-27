import { Injectable } from '@nestjs/common';
import { GeostoreService } from './geostore.service';
import { Logger } from '@nestjs/common';
import fs from 'fs';
import FormData from 'form-data';
import axios from 'axios';
import { CoverageService } from './coverage.service';
import { IArea, IGeojson } from '../models/area.entity';
import { IUser } from '../../common/user.model';
import { ConfigService } from '@nestjs/config';
import { IGeostore } from '../models/geostore.entity';

@Injectable()
export class AreasService {
  constructor(
    private readonly geostoreService: GeostoreService,
    private readonly coverageService: CoverageService,
    private readonly configService: ConfigService,
  ) {}
  private readonly logger = new Logger(AreasService.name);

  async getArea(areaId: string, user: IUser): Promise<IArea | null> {
    try {
      const baseURL = this.configService.get('areasApi.url');
      const url = `${baseURL}/v2/area/${areaId}`;
      const getAreasRequestConfig = {
        headers: {
          authorization: user.token ?? '',
        },
      };
      const { data } = await axios.get(url, getAreasRequestConfig);
      this.logger.log(`Got area with id ${data.data.id}`);
      return data && data.data;
    } catch (e: any) {
      if (e.response.status === 404) return null;
      this.logger.error('Error while fetching area', e);
      throw e;
    }
  }

  async getAreaMICROSERVICE(areaId: string): Promise<IArea | null> {
    try {
      const baseURL = this.configService.get('areasApi.url');
      const url = `${baseURL}/v1/area/${areaId}`;
      const getAreasRequestConfig = {
        headers: {
          authorization: `Bearer ${this.configService.get('service.token')}`,
        },
      };
      const { data } = await axios.get(url, getAreasRequestConfig);
      this.logger.log(`Got area with id ${data.data.id}`);
      return data && data.data;
    } catch (e: any) {
      if (e.response.status === 404) return null;
      this.logger.error('Error while fetching area', e);
      throw e;
    }
  }

  async getUserAreas(user: IUser): Promise<IArea[]> {
    try {
      const baseURL = this.configService.get('areasApi.url');
      const url = `${baseURL}/v2/area`;
      const getUserAreasRequestConfig = {
        headers: {
          authorization: user.token ?? '',
        },
      };
      const response = await axios.get(url, getUserAreasRequestConfig);
      const areas = response.data;
      this.logger.log(
        `Got ${areas.data.length} user areas for user ${user.id}`,
      );
      if (areas && areas.data) {
        // exclude areas that have wdpaid or admin object keys
        const areasToReturn = areas.data.filter((area) => {
          const wdpa = !!area.attributes.wdpaid;
          const gadm =
            !!area.attributes.admin &&
            Object.keys(area.attributes.admin).length > 0 &&
            !Object.values(area.attributes.admin).every((x) => x === null);
          return !wdpa && !gadm;
        });
        return areasToReturn;
      } else return [];
    } catch (e: any) {
      if (e.response.status === 404) return [];
      this.logger.error('Error while fetching areas', e);
      throw e;
    }
  }

  async createAreaWithGeostore(
    { name, image },
    geojson,
    user: IUser,
  ): Promise<any> {
    let geostore: IGeostore | undefined;
    let coverage;
    const ALERTS_SUPPORTED = this.configService.get('alertsSupported');

    try {
      geostore = await this.geostoreService.createGeostore(
        geojson,
        user.token ?? '',
      );
    } catch (error) {
      this.logger.error('Error while creating geostore', error);
      throw error;
    }
    if (geostore.areaHa > 2000000) throw 'Area is too large';
    try {
      coverage = await this.coverageService.getCoverage(
        {
          geostoreId: geostore?.id,
          slugs: ALERTS_SUPPORTED,
        },
        user.token ?? '',
      );
    } catch (error) {
      this.logger.error('Error while getting area coverage', error);
      throw error;
    }
    try {
      const form = new FormData();
      form.append('name', name);
      form.append('geostore', geostore?.id);
      form.append('image', fs.createReadStream(image.path));

      const baseURL = this.configService.get('areasApi.url');
      const url = `${baseURL}/v1/area/fw/${user.id}`;

      const createAreaRequestConfig = {
        headers: {
          ...form.getHeaders(),
          authorization: user.token ?? '',
        },
      };
      const { data } = await axios.post(url, form, createAreaRequestConfig);
      return { geostore, area: data.data, coverage };
    } catch (error) {
      this.logger.error('Error while creating area with geostore', error);
      throw error;
    }
  }

  async updateAreaWithGeostore(
    { name, image },
    geojson: IGeojson,
    existingArea: IArea,
    user: IUser,
  ) {
    let geostoreId;
    let coverage;
    const ALERTS_SUPPORTED = this.configService.get('alertsSupported');

    if (geojson) {
      try {
        const geostoreResponse = await this.geostoreService.createGeostore(
          geojson,
          user.token ?? '',
        );
        geostoreId = geostoreResponse?.id;
      } catch (e) {
        this.logger.error('Error while creating geostore', e);
        throw e;
      }
    } else geostoreId = existingArea.attributes.geostore;
    try {
      const params = {
        geostoreId,
        slugs: ALERTS_SUPPORTED,
      };
      coverage = await this.coverageService.getCoverage(
        params,
        user.token ?? '',
      );
    } catch (e) {
      this.logger.error('Error while getting area coverage', e);
      throw e;
    }
    try {
      const form = new FormData();
      if (name) form.append('name', name);
      form.append('geostore', geostoreId);
      if (image) form.append('image', fs.createReadStream(image.path));

      const baseURL = this.configService.get('areasApi.url');
      const url = `${baseURL}/v2/area/${existingArea.id}`;

      const createAreaRequestConfig = {
        headers: {
          ...form.getHeaders(),
          authorization: user.token ?? '',
        },
      };
      const { data } = await axios.patch(url, form, createAreaRequestConfig);
      this.logger.log(`Updated area with id ${data.data.id}`);
      return { geostoreId, area: data.data, coverage };
    } catch (e) {
      this.logger.error('Error while updating area with geostore', e);
      throw e;
    }
  }

  async delete(areaId: string, user: IUser): Promise<IArea> {
    try {
      const baseURL = this.configService.get('areasApi.url');
      const url = `${baseURL}/v2/area/${areaId}`;
      const deleteAreaRequestConfig = {
        headers: {
          authorization: user.token ?? '',
        },
      };
      const { data } = await axios.delete(url, deleteAreaRequestConfig);
      const area = data.data;
      this.logger.log(`Area with id ${areaId} deleted`);
      return area;
    } catch (error) {
      this.logger.error('Error while deleting area', error);
      throw error;
    }
  }
}
