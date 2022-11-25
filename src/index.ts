import Koa from 'koa'
import { koaBody } from 'koa-body'
import koaMount from 'koa-mount'
import koaRange from 'koa-range'
import koaStatic from 'koa-static'

import { serverAdapter } from "./queue/index.js"
import { cors, responseTime } from './middle/index.js'
import route from './route/index.js'
import config from './config/index.js'

const app = new Koa()

// 使用自定义中间件
app.use(responseTime)
// cors
app.use(cors)
// https range
app.use(koaRange)
// static body
app.use(koaMount('/data', koaStatic('./data')))
// post body
app.use(koaBody({multipart:true}))
// 注册bull-board
app.use(serverAdapter.registerPlugin())
// 请求路由
app.use(route.routes())

app.listen(config.port)
console.log('\x1b[36m%s\x1b[0m', 'open in browser http://127.0.0.1:' + config.port)
