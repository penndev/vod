import Router from '@koa/router'
import Jwt from 'jsonwebtoken'
import config from '../config/index.js'
import mime from 'mime'
import { Next } from 'koa'
import { koaBody } from 'koa-body'
import { AdminAccesslog, AdminUser, AdminRole } from '../orm/index.js'
import { serverAdapter } from '../task/index.js'
import { createReadStream, existsSync, statSync } from 'fs'
import { parseNumber } from '../util/index.js'

export const cors = async (ctx: Router.RouterContext, next: Next) => {
    if (ctx.method === 'OPTIONS') {
        ctx.status = 204
    } else {
        await next()
    }
    ctx.set('Access-Control-Allow-Origin', '*')
    ctx.set('Access-Control-Allow-Methods', '*')
    ctx.set('Access-Control-Allow-Headers', '*')
    ctx.set('Access-Control-Max-Age', '3600')
    ctx.set('Access-Control-Allow-Credentials', 'true')
}

export const log = async (ctx: Router.RouterContext, next: Next) => {
    const start = Date.now()
    try {
        await next()
    } catch (error) {
        const date = new Date()
        console.error('\x1b[31m [%s] %s', date.toISOString(), error)
        const err = (error as Error)
        ctx.status = 500
        ctx.body = {
            name: err.name,
            message: err.message,
            stack: err.stack
        }
    }

    const ms = Date.now() - start
    ctx.set('X-Response-Time', `${ms}ms`)
    console.log('\x1b[32m%s\x1b[33m\t[%s]\x1b[32m[%sms]\x1b[0m -> \x1b[1;35m%s\x1b[0m', ctx.request.method, ctx.response.status, ms, ctx.request.URL)
}

/** admin api 鉴权 */
export const auth = async (ctx: Router.RouterContext, next: Next) => {
    const token = ctx.request.header['x-token']
    if (typeof token !== 'string' || !token) {
        ctx.status = 401
        ctx.body = { message: '请进行用户验证' }
        return
    }
    let adminInfo:AdminUser|null = null
    // 进行用户认证以及登录权限
    try {
        const payload = Jwt.verify(token, config.secret)
        adminInfo = await AdminUser.findByPk(Number(payload.sub))
        if (adminInfo === null) {
            ctx.status = 401
            ctx.body = { message: '用户失效' }
            return
        }
        if (adminInfo.status === 0) {
            ctx.status = 401
            ctx.body = { message: '用户禁止登录' }
            return
        }
        ctx.state = adminInfo
    } catch (error) {
        ctx.status = 401
        ctx.body = { message: '用户验证失败[' + error + ']' }
        return
    }

    // console.log("----------------------------------------------------")
    // console.log(ctx.req.url,ctx.URL.pathname,ctx.request.URL.pathname)
    // console.log("----------------------------------------------------")

    // 判断是否需要进行接口鉴权
    if (adminInfo.adminRoleId !== 0) {
        const roleInfo = await AdminRole.findByPk(adminInfo.adminRoleId)
        if (roleInfo == null) {
            ctx.status = 403
            ctx.body = { messge: '权限匹配失败' }
            return
        }
        let denyIs = true
        const allowArr = JSON.parse(roleInfo.route)
        if (allowArr) {
            for (const allowItem of allowArr) {
                if (allowItem.path === '*' || allowItem.path === ctx.request.path) {
                    denyIs = false
                    break
                }
            }
        }
        if (denyIs) {
            ctx.status = 403
            ctx.body = { message: '接口访问鉴权未允许' }
            return
        }
    }
    await next()
    const param = {
        query: ctx.request.query,
        body: ctx.request.body
    }

    /**
   * 处理记录什么类型的日志，如果什么都记录会数据过大
   */
    if (ctx.request.method in ['POST', 'DELETE']) {
        await AdminAccesslog.create({
            adminUserId: adminInfo.id,
            path: ctx.request.path,
            method: ctx.request.method,
            ip: ctx.request.ip,
            payload: JSON.stringify(param, null, 2),
            status: ctx.response.status
        })
    }
}

/** koa post 拓展 */
export const body = koaBody({ multipart: true })

/** bull koa adapter面板 */
export const bull = (path:string) => {
    return serverAdapter.setBasePath(path).registerPlugin()
}

export const mount = (u:string, d:string) => {
    return async (ctx: Router.RouterContext, next: Next) => {
        if (ctx.request.path.startsWith(u) && (ctx.request.method === 'GET' || ctx.request.method === 'HEAD')) {
            const fspath = decodeURIComponent(ctx.request.path.replace(RegExp('^' + u), d))
            if (existsSync(fspath)) { // 文件存在
                const fsstat = statSync(fspath)
                if (fsstat.isFile()) { // 处理发送文件，并实现 http range
                    ctx.set('Last-Modified', fsstat.birthtime.toUTCString())
                    const ctype = mime.getType(fspath)
                    if (ctype) {
                        ctx.set('Content-Type', ctype)
                    }
                    const range = ctx.request.headers.range
                    ctx.set('Accept-Ranges', 'bytes')
                    if (range) {
                        ctx.status = 206
                        const parts = range.replace(/bytes=/, '').split('-')
                        const start = parseNumber(parts[0], 0)
                        const endbyte = parseNumber(parts[1], fsstat.size - 1)
                        const end = endbyte >= fsstat.size ? fsstat.size - 1 : endbyte
                        ctx.set('Content-Length', `${end - start + 1}`)
                        ctx.set('Content-Range', `bytes ${start}-${end}/${fsstat.size}`)
                        ctx.body = createReadStream(fspath, { start, end })
                    } else {
                        ctx.status = 200
                        ctx.set('Content-Length', `${fsstat.size}`)
                        ctx.body = createReadStream(fspath)
                    }
                    return
                }
            }
        }
        await next()
    }
}
