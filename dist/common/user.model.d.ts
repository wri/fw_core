export interface IUser {
    id: string;
    "_id": string;
    email: string;
    name: string;
    provider: string;
    role: string;
    extraUserData: any;
    createdAt: string;
    updatedAt: string;
    token?: string;
}
