import { IUser } from './common/user.model';
import { TemplateDocument } from './templates/models/template.schema';
import { TeamDocument } from './teams/models/team.schema';
declare global {
    namespace Express {
        interface Request {
            user: IUser;
            template: TemplateDocument;
            userTeams: TeamDocument[];
        }
    }
}
