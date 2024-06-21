import {
  Controller,
  Get,
  Logger,
  Param,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthUser } from '../common/decorators';
import { IUser } from '../common/user.model';
import { ConfigService } from '@nestjs/config';
import mongoose from 'mongoose';
import { StatisticsService } from './statistics.service';
import { RedisService } from '../common/redis.service';

@Controller('statistics')
export class StatisticsController {
  constructor(
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
    private readonly statisticsService: StatisticsService,
  ) {}
  private readonly logger = new Logger(StatisticsController.name);

  @Get('/teams')
  async teamStats(@AuthUser() user: IUser): Promise<any> {
    if (
      this.configService.get('ENV') === 'production' &&
      (!["ADMIN", "MANAGER"].includes(user.role))
    ) {
      throw new UnauthorizedException('Only an admin can access this data');
    }

    const id = new mongoose.Types.ObjectId().toString();
    this.statisticsService.getTeamStats(id);

    return { id };
  }

  @Get('/reports')
  async reportStats(@AuthUser() user: IUser): Promise<any> {
    if (
      this.configService.get('ENV') === 'production' &&
      user.role !== 'ADMIN'
    ) {
      throw new UnauthorizedException('Only an admin can access this data');
    }

    const id = new mongoose.Types.ObjectId().toString();
    this.statisticsService.getReportStats(id);

    return { id };
  }

  @Get('/results/:id')
  async getStats(@Param('id') id: string): Promise<any> {
    const data = await this.redisService.get(id);
    if (data) return { data: JSON.parse(data) };
    return { data: null };
  }
}
