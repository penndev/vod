import Router from '@koa/router'
import { Next } from 'koa'
import Jwt from 'jsonwebtoken'
import config from '../config/index.js'
import { AdminAccessLog, Admin, Role } from '../orm/model.js'

export const cors = async (ctx: Router.RouterContext, next: Next) => {
    if (ctx.method !== 'OPTIONS') {
        await next()
    }else{
        ctx.status = 204;
    }
    ctx.set('Access-Control-Allow-Origin', '*')
    ctx.set('Access-Control-Allow-Methods', '*')
    ctx.set('Access-Control-Allow-Headers', '*')
}

export const time = async (ctx: Router.RouterContext, next: Next) => {
    const start = Date.now();
    try {
        await next();
    } catch (error) {
        const err = (error as Error)
        ctx.status = 500
        ctx.body = {
            name: err.name,
            message: err.message,
            stack: err.stack
        }
    }
    
    const ms = Date.now() - start
    ctx.set('X-Response-Time', `${ms}ms`);
    console.log('\x1b[32m%s\x1b[33m\t[%s]\x1b[32m[%sms]\x1b[0m -> \x1b[1;35m%s\x1b[0m', ctx.request.method, ctx.response.status, ms, ctx.request.URL)
}

export const auth = async (ctx: Router.RouterContext, next: Next) => {
    const token = ctx.request.header['x-token'] 
    if(typeof token !== 'string' || !token){
        ctx.status = 401, ctx.body = {'message':'请进行用户验证'}
        return
    }
    let adminInfo:Admin|null = null
    //进行用户认证以及登录权限
    try {
        const payload = Jwt.verify(token, config.secret)
        adminInfo = await Admin.findByPk(Number(payload.sub))
        if(adminInfo === null){
            ctx.status = 401, ctx.body = {'message':'用户失效'}
            return
        }
        if(adminInfo.status == 0){
            ctx.status = 401, ctx.body = {'message':'用户禁止登录'}
            return
        }
        ctx.state = adminInfo
    } catch (error) {
        ctx.status = 401, ctx.body = {'message':'用户验证失败[' + error + ']'}
        return
    }

    // console.log("----------------------------------------------------") 
    // console.log(ctx.req.url,ctx.URL.pathname,ctx.request.URL.pathname)
    // console.log("----------------------------------------------------") 

    //判断是否需要进行接口鉴权
    if(adminInfo.roleId != 0){
        const roleInfo = await Role.findByPk(adminInfo.roleId)
        if(roleInfo == null){
            ctx.status = 403, ctx.body = {messge:'权限匹配失败'}
            return 
        }
        let denyIs = true
        const allowArr = JSON.parse(roleInfo.route)
        for(const allowItem of allowArr){
            if(allowItem.path == ctx.URL.pathname){
                denyIs = false
                break
            }
        }
        if(denyIs){
            ctx.status = 403, ctx.body = {messge:'接口访问鉴权未允许'}
            return 
        }
    }
    await next()
    AdminAccessLog.create({
        admin: adminInfo.id,
        path:ctx.URL.pathname,
        method: ctx.request.method,
        ip:ctx.request.ip,
        payload: JSON.stringify(ctx.request.query) + JSON.stringify(ctx.request.body),
        status: ctx.response.status
    })
}
