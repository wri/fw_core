"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Redis = require('ioredis');
const config = require("config");
const client = new Redis(config.get('redis.url'));
exports.default = client;
//# sourceMappingURL=redisClient.js.map