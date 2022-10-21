import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { Logger } from '@nestjs/common';
import client from '../../common/redisClient';
import deserialize from '../../common/deserlializer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GeostoreService {
  constructor(private readonly configService: ConfigService) {}
  private readonly logger = new Logger(GeostoreService.name);

  async createGeostore(geojson: any, token: string): Promise<any> {
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
    }
  }

  async getGeostore(geostoreId: any, token: string) {
    // check for geostore in redis hash
    let geostore;
    const geostoreString: any = await client.get(geostoreId.toString());
    if (geostoreString) {
      geostore = JSON.parse(geostoreString);
      this.logger.log(`Found Geostore ${geostore.id} in Redis store`);
    } else {
      try {
        const baseURL = this.configService.get('geostoreApi.url');
        const url = `${baseURL}/geostore/${geostoreId}`;
        const getGeostoreRequestConfig = {
          headers: {
            authorization: token,
          },
        };
        const { data } = await axios.get(url, getGeostoreRequestConfig);
        geostore = deserialize(data.data);
        client.set(
          geostoreId.toString(),
          JSON.stringify(geostore),
          'EX',
          7 * 60 * 60 * 24,
        ); // set to expire in 7 days
      } catch (error) {
        this.logger.error('Error while fetching geostore', error);
        throw error;
      }
    }
    return geostore;
  }
}
