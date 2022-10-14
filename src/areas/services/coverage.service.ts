import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { Logger } from '@nestjs/common';
import deserialize from '../../common/deserlializer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CoverageService {

  constructor(
    private readonly configService: ConfigService
    ) { }
  private readonly logger = new Logger(CoverageService.name)

  async getCoverage({ geostoreId, slugs }, token: string) {

    try {
      const baseURL = this.configService.get("geostoreAPI.url");
      const url = `${baseURL}/coverage/intersect?geostore=${geostoreId}${slugs ? `&slugs=${slugs}` : ""}`;
      const getCoverageRequestConfig = {
        headers: {
          authorization: token
        }
      };
      const { data } = await axios.get(url, getCoverageRequestConfig);

      return data && deserialize(data.data);
      
    } catch (error) {
      this.logger.error("Error while fetching coverage", error);
      throw error;
    }
  }
}
