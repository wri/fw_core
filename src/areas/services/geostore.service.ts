import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { Logger } from '@nestjs/common';
import deserialize from '../../common/deserlializer';
import { ConfigService } from '@nestjs/config';
import { IGeojson, IGeostore } from '../models/area.entity';
import { RedisService } from '../../common/redis.service';

@Injectable()
export class GeostoreService {
  constructor(
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {}
  private readonly logger = new Logger(GeostoreService.name);

  async createGeostore(
    geojson: IGeojson,
    token: string,
  ): Promise<IGeostore | undefined> {
    try {
      const baseURL = this.configService.get('geostoreApi.url');
      const url = `${baseURL}/geostore`;
      const body = {
        geojson,
        lock: true,
      };
      const createGeostoreRequestConfig = {
        headers: {
          authorization: token,
        },
      };
      const { data } = await axios.post(url, body, createGeostoreRequestConfig);
      return data && deserialize(data.data);
    } catch (error) {
      this.logger.error('Error while creating geostore', error);
      throw error;
    }
  }

  async getGeostore(
    geostoreId: string,
    token: string,
  ): Promise<IGeostore | null> {
    // check for geostore in redis hash
    const geostoreString = await this.redisService.get(geostoreId.toString());
    if (geostoreString) {
      const geostore = JSON.parse(geostoreString);
      this.logger.log(`Found Geostore ${geostore.id} in Redis store`);
      return geostore;
    }

    try {
      const baseURL = this.configService.get('geostoreApi.url');
      const url = `${baseURL}/geostore/${geostoreId}`;
      const getGeostoreRequestConfig = {
        headers: {
          authorization: token,
        },
      };
      const { data } = await axios.get(url, getGeostoreRequestConfig);
      const geostore = deserialize(data.data);
      await this.redisService.set(
        geostoreId.toString(),
        JSON.stringify(geostore),
      );
      return geostore as IGeostore;
    } catch (error: any) {
      if (error.response.status === 404) return null;
      this.logger.error('Error while fetching geostore', error);
      throw error;
    }
  }
}
