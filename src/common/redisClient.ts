const Redis = require('ioredis');
import config = require("config");
const client = new Redis(config.get('redis.url'));

export default client;


