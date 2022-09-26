import { Injectable } from '@nestjs/common';
import config = require('config')
import axios from 'axios';
import { Logger } from '@nestjs/common';
import client from '../../common/redisClient';
import deserialize from '../../common/deserlializer';
import { IGeojson, IGeostore } from '../models/area.entity';
import { IUser } from '../../common/user.model';

@Injectable()
export class GeostoreService {

    private readonly logger = new Logger(GeostoreService.name)

    async createGeostore(geojson: any, token: string): Promise<any> {
        try {
            const baseURL = config.get("geostoreAPI.url")
            const url = `${baseURL}/geostore`
            const body = {
                geojson,
                lock: true
            }
            const createGeostoreRequestConfig = {
                headers: {
                    authorization: token
                }
            };
            const { data } = await axios.post(url, body, createGeostoreRequestConfig);
            return data && deserialize(data.data)
        } catch (error) {
            this.logger.error("Error while creating geostore", error)
        }
    }

    async getGeostore(geostoreId: any, token: string) {
        // check for geostore in redis hash
        let geostore: any = await client.get(geostoreId.toString())
        if (!geostore) {
            try {
                const baseURL = config.get("geostoreAPI.url");
                const url = `${baseURL}/geostore/${geostoreId}`
                const getGeostoreRequestConfig = {
                    headers: {
                        authorization: token
                    }
                };
                const { data } = await axios.get(url, getGeostoreRequestConfig);
                geostore = deserialize(data.data);
                client.set(geostoreId.toString(), geostore, 'EX', 7 * 60 * 60 * 24) // set to expire in 7 days
            } catch (error) {
                this.logger.error("Error while fetching geostore", error);
                throw error;
            }
        }
        return geostore;
    }
}
