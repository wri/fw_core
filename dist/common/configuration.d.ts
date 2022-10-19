declare const _default: () => {
    port: number;
    mongodb: {
        host: string;
        port: string;
        secret: any;
        database: string;
    };
    s3: {
        accessKeyId: string;
        secretAccessKey: string;
    };
};
export default _default;
