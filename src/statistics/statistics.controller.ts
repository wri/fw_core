import { Controller, Get, Logger } from '@nestjs/common';
import { TeamDocument } from '../teams/models/team.schema';
import { TeamsService } from '../teams/services/teams.service';
import { TeamMembersService } from '../teams/services/teamMembers.service';
import { AuthUser } from '../common/decorators';
import { IUser } from '../common/user.model';
import _ from 'lodash';
import { AnswersService } from '../answers/services/answers.service';
import { AnswerDocument } from '../answers/models/answer.model';

@Controller('statistics')
export class StatisticsController {
  constructor(
    private readonly teamsService: TeamsService,
    private readonly teamMembersService: TeamMembersService,
    private readonly answerService: AnswersService,
  ) {}
  private readonly logger = new Logger(StatisticsController.name);

  @Get('/teams')
  async teamStats(@AuthUser() user: IUser): Promise<any> {
    const teams: TeamDocument[] = await this.teamsService.findAll();
    const teamMemberCounts =
      (await this.teamMembersService.getTeamMemberCounts()) as any as {
        _id: string;
        count: number;
      }[];
    const counts = teamMemberCounts.map((count) => count.count);
    /*     const groupedMembers = _.groupBy(teamMembers, (member) => member.teamId);
    const memberCounts: number[] = [];
    for (const [key, value] of Object.entries(groupedMembers))
      memberCounts.push(value.length); */

    return {
      teamCount: teams.length,
      teamMembers: {
        mean: counts.reduce((p, c) => p + c, 0) / counts.length,
        median: this.median(counts),
        max: Math.max(...counts),
      },
    };
  }

  @Get('/reports')
  async reportStats(@AuthUser() user: IUser): Promise<any> {
    const reports: AnswerDocument[] = await this.answerService.find({});
    const reportStats: {
      year: string;
      count: number;
      months: { month: string; count: number }[];
    }[] = [];
    reports.forEach((report) => {
      const date = new Date(report.createdAt);
      const year = date.getFullYear().toString();
      const month = date.toLocaleString('default', { month: 'long' });
      const yearObjIndex = reportStats.findIndex(
        (yearStat) => yearStat.year === year,
      );
      if (yearObjIndex === -1)
        reportStats.push({
          year,
          count: 1,
          months: [{ month, count: 1 }],
        });
      else {
        const yearObj = reportStats[yearObjIndex];
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
        reportStats[yearObjIndex] = {
          year: yearObj.year,
          count: yearObj.count + 1,
          months,
        };
      }
    });
    return reportStats;
  }

  median(array: number[]): number {
    if (array.length === 0) return 0;
    array = [...array].sort((a, b) => a - b);
    const half = Math.floor(array.length / 2);
    return array.length % 2 ? array[half] : (array[half - 1] + array[half]) / 2;
  }
}
