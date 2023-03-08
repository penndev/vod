/**
 * 批量集群使用
 * host 将根据node来配置不同的 上传下载文件的域名。
 * redis 将根据不同的node来配置不同的cache防止key冲突
 */
const config = {
    node: 1,
    host: process.env.HOST ?? "127.0.0.1",
    port: process.env.PORT ? parseInt(process.env.PORT) : 8080,
    secret: "secret", // 多节点配置 密钥必须相同
    rdsuri: "redis://127.0.0.1:6379",
    dburi: "mariadb://root:123456@localhost:3306/vod",
}

export default config