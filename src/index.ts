import Koa from 'koa'

import { cors, log, bull, mount } from './middle/index.js'
import { adminRoute } from './route/index.js'
import config from './config/index.js'
import { networks } from './util/index.js'
import { AddressInfo } from 'net'

const app = new Koa()

// 允许跨域
app.use(cors)

// 请求日志记录
app.use(log)

// 请求路由主入口
app.use(adminRoute('/api'))

// 挂载静态入口
app.use(mount('/data', './data'))

/**
 * bull-board http://{host}/bull
 * 开启访问bull队列的仪表盘
 * 正式环境需要进行权限验证请自行定义
 */
if (config.mode === 'dev') {
    app.use(bull('/bull'))
}

app.on('error', (err) => {
    if (err.code === 'ECONNABORTED' || err.code === 'ECONNRESET') {
    // tcp客户端关闭 koa不对tcp层做处理
    } else {
        console.error(err)
    }
})

const srv = app.listen(config.port, config.host)

srv.on('listening', () => {
    const srvAddr = srv.address() as AddressInfo
    for (const item of networks(srvAddr.address)) {
        console.log('\x1b[34mOPEN Browser\x1b[1;33m -> \x1b[0;32mhttp://%s:%s\x1b[0m', item.address, srvAddr.port)
    }
})
