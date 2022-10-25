import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Injectable()
export class DatabaseService {
  constructor(
    @InjectConnection('apiDb') private readonly apiConnection: Connection,
    @InjectConnection('teamsDb') private readonly teamsConnection: Connection,
    @InjectConnection('formsDb') private readonly formsConnection: Connection,
  ) {}

  getApiHandle(): Connection {
    return this.apiConnection;
  }

  getTeamsHandle(): Connection {
    return this.teamsConnection;
  }

  getFormsHandle(): Connection {
    return this.formsConnection;
  }
}
