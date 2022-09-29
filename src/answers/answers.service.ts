import { Injectable } from '@nestjs/common';
import { CreateAnswerDto } from './dto/create-answer.dto';
import { UpdateAnswerDto } from './dto/update-answer.dto';
import { Answer, AnswerDocument, IAnswer } from './models/answer.model';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { IUser } from '../common/user.model';
import { TeamDocument } from '../teams/models/team.schema';
import { EMemberRole } from '../teams/models/teamMember.schema';
import { TeamMembersService } from '../teams/services/teamMembers.service';
import mongoose from 'mongoose';
import { UserService } from '../common/user.service';
import { Template, TemplateDocument } from '../templates/models/template.schema';


@Injectable()
export class AnswersService {
  constructor(
    @InjectModel(Template.name, 'formsDb') private templateModel: Model<TemplateDocument>,
    @InjectModel(Answer.name, 'formsDb') private answerModel: Model<AnswerDocument>,
    private readonly teamMembersService: TeamMembersService,
    private readonly userService: UserService
) { }

  create(createAnswerDto: CreateAnswerDto) {
    return 'This action adds a new answer';
  }

  findAll() {
    return `This action returns all answers`;
  }

  async getAllAnswers({ loggedUser, teams }: {loggedUser: IUser, teams: TeamDocument[]}): Promise<IAnswer[]> {
    let filter = {};
    let teamsManaged = [];
    const confirmedUsers = [];
    if (teams.length > 0) {
      // check if user is manager of any teams
      teamsManaged = teams.filter(
        team => team.userRole === EMemberRole.Manager || team.userRole === EMemberRole.Administrator
      );
      // get all managed teams users
      if (teamsManaged.length > 0) {
        for await (const team of teamsManaged) {
          // get users of each team and add to users array
          const teamUsers = await this.teamMembersService.findAllTeamMembers(team.id, EMemberRole.Administrator);
          if (teamUsers) confirmedUsers.push(...teamUsers.map(teamUser => new mongoose.Types.ObjectId(teamUser.userId)));
        }
      }
    }
    // add current user to users array
    confirmedUsers.push(new mongoose.Types.ObjectId(loggedUser.id));

    filter = { user: { $in: confirmedUsers } };

    let answers = await this.answerModel.find(filter);

    return await this.addUsernameToAnswers(answers);
  }

  async findSome(filter) {
    return await this.answerModel.find(filter);
  }

  findOne(id: number) {
    return `This action returns a #${id} answer`;
  }

  update(id: number, updateAnswerDto: UpdateAnswerDto) {
    return `This action updates a #${id} answer`;
  }

  remove(id: number) {
    return `This action removes a #${id} answer`;
  }

  async delete(filter): Promise<void> {
    await this.answerModel.deleteMany(filter)
  }

  async addUsernameToAnswers(answers: IAnswer[]): Promise<IAnswer[]> {

    for await (let answer of answers) {
      let userId = answer.user;
      const fullName = await this.userService.getNameByIdMICROSERVICE(userId);
      answer.fullName = fullName;
      }
    
    return answers
  };
}
