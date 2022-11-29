import Router from "@koa/router"
import { Next } from "koa";

export const responseTime = async (ctx: Router.RouterContext, next: Next) => {
    const start = Date.now();
    await next();
    const ms = Date.now() - start;
    ctx.set('X-Response-Time', `${ms}ms`);
}


export const cors = async (ctx: Router.RouterContext, next: Next) => {
    if (ctx.method !== 'OPTIONS') {
        console.log('\x1b[36m %s -> %s \x1b[0m', ctx.request.method,ctx.request.URL)
        await next()
    }else{
        ctx.status = 204;
    }
    ctx.set('Access-Control-Allow-Origin', '*')
    ctx.set('Access-Control-Allow-Methods', '*')
    ctx.set('Access-Control-Allow-Headers', '*')
}


export const auth = async (ctx: Router.RouterContext, next: Next) => {
    const token = ctx.request.header['x-token']
    if(!token){
        ctx.status = 401
        ctx.body = {"message":"请进行用户验证"}
        return
    }
    await next()
}
