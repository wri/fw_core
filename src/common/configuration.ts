export default () => ({
  port: parseInt(process.env.PORT ?? '4042', 10),
  mongodb: {
    host: process.env.MONGODB_HOST,
    port: process.env.MONGODB_PORT,
    secret:
      typeof process.env.DB_SECRET === 'string'
        ? JSON.parse(process.env.DB_SECRET)
        : null,
    database: process.env.DB_DATABASE,
  },
  s3: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    bucket: process.env.S3_BUCKET,
    folder: process.env.S3_FOLDER,
  },
  areasApi: {
    url: process.env.AREAS_API_URL,
  },
  geostoreApi: {
    url: process.env.GEOSTORE_API_URL,
  },
  auth: {
    url: process.env.AUTH_URL,
  },
  service: {
    token: process.env.MICROSERVICE_TOKEN,
  },
  redis: {
    url: process.env.REDIS_URL,
  },
  alertsSupported: 'umd_as_it_happens',
});
