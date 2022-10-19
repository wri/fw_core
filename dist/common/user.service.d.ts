export declare class UserService {
    private readonly logger;
    authorise(token: string): Promise<any>;
    getNameByIdMICROSERVICE(userId: string): Promise<any>;
    getUserFromRequest(request: any): any;
}
