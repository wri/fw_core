import { Injectable } from '@nestjs/common';
import config = require('config')
import axios from 'axios';
import { Logger } from '@nestjs/common';
import deserialize from '../../common/deserlializer';
import { IUser } from '../../common/user.model';

@Injectable()
export class CoverageService {

  private readonly logger = new Logger(CoverageService.name)

  async getCoverage({ geostoreId, slugs }, token: string) {

    try {
      const baseURL = config.get("geostoreAPI.url");
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
