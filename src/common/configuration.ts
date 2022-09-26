export default () => ({
    port: parseInt(process.env.PORT, 10),
    mongodb: {
        host: process.env.MONGODB_HOST,
        port: process.env.MONGODB_PORT,
        secret: JSON.parse(process.env.DB_SECRET),
        database: process.env.DB_DATABASE
    }
})