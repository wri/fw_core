declare const ROLES: {
    USER: {
        id: string;
        _id: string;
        email: string;
        name: string;
        provider: string;
        role: string;
        extraUserData: {
            apps: any[];
        };
        createdAt: string;
        updatedAt: string;
    };
    MANAGER: {
        id: string;
        role: string;
        provider: string;
        email: string;
        extraUserData: {
            apps: string[];
        };
    };
    ADMIN: {
        id: string;
        role: string;
        provider: string;
        email: string;
        extraUserData: {
            apps: string[];
        };
    };
};
export default ROLES;
