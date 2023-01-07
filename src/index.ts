import Koa from 'koa'
import { koaBody } from 'koa-body'
import koaMount from 'koa-mount'
import koaRange from 'koa-range'
import koaStatic from 'koa-static'

import { serverAdapter } from "./queue/index.js"
import { cors, time } from './middle/index.js'
import route from './route/index.js'
import config from './config/index.js'
import { networks } from './util/index.js'

const app = new Koa()

app.use(cors)  // cors

app.use(koaRange) // range

app.use(time)

app.use(koaMount('/data', koaStatic('./data'))) // static

app.use(serverAdapter.registerPlugin()) // bull-board 

app.use(koaBody({multipart:true})) // post body

app.use(route.routes()) // 请求路由

app.listen(config.port, config.host)
for(const item of networks(config.host)){
    console.log('\x1b[34mOPEN Brower\x1b[1;33m -> \x1b[0;32mhttp://%s:%s\x1b[0m', item.address, config.port)
}

