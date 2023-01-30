const config = {
    host: "0.0.0.0",
    port: 8081,
    node: 1, //节点名称 number
    secret: "secret", // 多节点配置 密钥必须相同
    rdsuri: "redis://127.0.0.1:6379",
    dburi: "mariadb://root:123456@localhost:3306/hlsvod",
}

export default config