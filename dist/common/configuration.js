"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = () => ({
    port: parseInt(process.env.PORT, 10),
    mongodb: {
        host: process.env.MONGODB_HOST,
        port: process.env.MONGODB_PORT,
        secret: JSON.parse(process.env.DB_SECRET),
        database: process.env.DB_DATABASE
    },
    s3: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY
    }
});
//# sourceMappingURL=configuration.js.map