import { Injectable } from '@nestjs/common';
import { TeamsService } from '../teams/services/teams.service';
import { RedisService } from '../common/redis.service';
import { AnswersService } from '../answers/services/answers.service';
import { TeamMembersService } from '../teams/services/teamMembers.service';
import { TeamDocument } from '../teams/models/team.schema';
import { AnswerDocument } from '../answers/models/answer.model';

@Injectable()
export class StatisticsService {
  constructor(
    private readonly teamsService: TeamsService,
    private readonly teamMembersService: TeamMembersService,
    private readonly answerService: AnswersService,
    private readonly redisService: RedisService,
  ) {}

  async getTeamStats(id: string): Promise<void> {
    const teams: TeamDocument[] = await this.teamsService.findAll();
    const teamMemberCounts =
      (await this.teamMembersService.getTeamMemberCounts()) as any as {
        _id: string;
        count: number;
      }[];
    const counts = teamMemberCounts.map((count) => count.count);

    const teamStats = {
      teamCreated: this.calculateYearStats(teams.map((team) => team.createdAt)),
      teamCount: teams.length,
      teamMembers: {
        mean: counts.reduce((p, c) => p + c, 0) / counts.length,
        median: this.median(counts),
        max: Math.max(...counts),
      },
    };

    await this.redisService.set(id, JSON.stringify(teamStats), {
      expireIn: 60 * 60 * 24,
    }); // set to expire in a day

    return;
  }

  async getReportStats(id: string): Promise<void> {
    const reports: AnswerDocument[] = await this.answerService.find({});
    const reportStats = this.calculateYearStats(
      reports.map((report) => report.createdAt),
    );

    await this.redisService.set(id, JSON.stringify(reportStats), {
      expireIn: 60 * 60 * 24,
    }); // set to expire in a day

    return;
  }

  median(array: number[]): number {
    if (array.length === 0) return 0;
    array = [...array].sort((a, b) => a - b);
    const half = Math.floor(array.length / 2);
    return array.length % 2 ? array[half] : (array[half - 1] + array[half]) / 2;
  }

  calculateYearStats(dates: string[]) {
    const stats: {
      year: string;
      count: number;
      months: { month: string; count: number }[];
    }[] = [];
    dates.forEach((dateString) => {
      const date = new Date(dateString);
      const year = date.getFullYear().toString();
      const month = date.toLocaleString('default', { month: 'long' });
      const yearObjIndex = stats.findIndex(
        (yearStat) => yearStat.year === year,
      );
      if (yearObjIndex === -1){
        console.log(year)
        if (year === 'NaN' || year === NaN) console.log(date, dateString);
        stats.push({
          year,
          count: 1,
          months: [{ month, count: 1 }],
        });
      }
      else {
        const yearObj = stats[yearObjIndex];
        const months = yearObj.months;
        const monthObjIndex = months.findIndex(
          (monthStat) => monthStat.month === month,
        );
        if (monthObjIndex === -1)
          months.push({
            month,
            count: 1,
          });
        else {
          const foundMonth = months[monthObjIndex];
          months[monthObjIndex] = {
            month: foundMonth.month,
            count: foundMonth.count + 1,
          };
        }
        stats[yearObjIndex] = {
          year: yearObj.year,
          count: yearObj.count + 1,
          months,
        };
      }
    });
    return stats;
  }
}
