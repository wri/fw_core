import { Connection } from 'mongoose';
export declare class DatabaseService {
    private readonly apiConnection;
    private readonly teamsConnection;
    private readonly formsConnection;
    constructor(apiConnection: Connection, teamsConnection: Connection, formsConnection: Connection);
    getApiHandle(): Connection;
    getTeamsHandle(): Connection;
    getFormsHandle(): Connection;
}
