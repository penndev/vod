import dotenv from 'dotenv'
dotenv.config()

const config = {
    node: 0, //多节点运行拓展。
    mode: process.env.APP_MODE ?? "prod",
    host: process.env.APP_HOST ?? "127.0.0.1",
    port: process.env.APP_PORT ? parseInt(process.env.APP_PORT) : 8000,
    secret: process.env.APP_SECRET ?? "dev_secret", // 多节点配置 密钥必须相同

    redisParse: `redis://${process.env.REDIS_USERNAME ?? '' }:${process.env.REDIS_PASSWORD ?? '' }@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}/${process.env.REDIS_DATABASE}`,
    dbParse: `mariadb://${process.env.DB_USERNAME ?? '' }:${process.env.DB_PASSWORD ?? ''}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_DATABASE}`,
}

export default config