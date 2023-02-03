const config = {
    /**
     * 批量集群使用
     * host 将根据node来配置不同的 上传下载文件的域名。
     * redis 将根据不同的node来配置不同的cache防止key冲突
     */
    node: 1,
    host: "0.0.0.0",
    port: 8081,
    secret: "secret", // 多节点配置 密钥必须相同
    rdsuri: "redis://127.0.0.1:6379",
    dburi: "mariadb://root:123456@localhost:3306/hlsvod",
}

export default config