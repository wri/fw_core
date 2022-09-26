import { Logger, Injectable, HttpException, HttpStatus } from "@nestjs/common";
import axios from "axios";
import mongoose from "mongoose";
import config = require("config");
import client from './redisClient';

@Injectable()
export class UserService {

  private readonly logger = new Logger(UserService.name)

  async authorise(token: string): Promise<any> {
    try {
      const baseURL = config.get("auth.url");
      const url = `${baseURL}/auth/user/me`
      const getUserDetailsRequestConfig = {
        headers: {
          authorization: token
        }
      };
      const response = await axios.get(url,getUserDetailsRequestConfig);
      this.logger.log(`Received data for user with id ${response.data.id}`)
      return response.data
    } catch (e) {
      throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    }
  }

  async getNameByIdMICROSERVICE(userId: string) {
    if (!userId) return null;
    // check for teamMember in redis hash
    let name: string = await client.get(userId.toString())
    if (!name) {
      try {
        const baseURL = config.get("auth.url");
        const url = `${baseURL}/user/${userId}`
        const getUserDetailsRequestConfig = {
          headers: {
            authorization: `Bearer ${config.get("service.token")}`
          }
        };
        const response = await axios.get(url, getUserDetailsRequestConfig);
        const user = response.data;
        if (!user || !user.data) return null;
        const fullName = user.data.attributes.firstName
        ? `${user.data.attributes.firstName} ${user.data.attributes.lastName}`
        : user.data.attributes.lastName;
        this.logger.log(`Received name for user with id ${user.data.id} ${fullName}`)
        client.set(userId.toString(), fullName, 'EX', 60 * 60 * 24) // set to expire in a day
        return fullName;
      } catch (e) {
        Logger.error(`Error finding user ${userId}`, e);
        return null;
      }
    } else return name;
  }

  getUserFromRequest(request) {
    return Object.assign(
      {},
      request.query.loggedUser ? JSON.parse(request.query.loggedUser) : request.body.loggedUser
    )

  }
}