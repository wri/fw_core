const Redis = require('ioredis');
const client = new Redis(process.env.REDIS_URL);

export default client;


