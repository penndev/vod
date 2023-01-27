import Koa from 'koa'

import { cors, time, bull } from './middle/index.js'
import routes from './route/index.js'
import config from './config/index.js'
import { networks } from './util/index.js'

const app = new Koa()

app.use(time), app.use(cors)

// 请求路由主入口
app.use(routes) 

if(process.env.NODE_ENV == "dev"){
    app.use(bull) // protocol://host/bull
}

app.listen(config.port, config.host)
for(const item of networks(config.host)){
    console.log('\x1b[34mOPEN Brower\x1b[1;33m -> \x1b[0;32mhttp://%s:%s\x1b[0m', item.address, config.port)
}

