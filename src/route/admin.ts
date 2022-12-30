import Router from '@koa/router'
import Captcha from 'svg-captcha'
import Redis from '../redis/index.js'
import { randomUUID } from 'crypto'
import { AdminUser } from '../orm/index.js'
import Jwt from 'jsonwebtoken'
import Config from '../config/index.js'

/**
 * 获取系统验证码
 * @param ctx
 */
export const captcha = async (ctx: Router.RouterContext) => {
    const uuid = 'captcha-' + randomUUID()
    const imgdata = Captcha.create({
        charPreset: '1234567890',
        size: 4,
    })
    Redis.set(uuid, imgdata.text, { EX: 60 })
    ctx.body = {
        captchaURL: `data:image/svg+xml;base64,${Buffer.from(imgdata.data, 'binary').toString('base64')}`,
        captchaID: uuid
    }
}

/**
 * 后台管理员登录
 * @param ctx 
 * @returns 
 */
export const login = async (ctx: Router.RouterContext) => {
    const { captchaID, captcha, username, password } = ctx.request.body
    const text = await Redis.get(captchaID)
    if (text !== captcha) {
        ctx.status = 400, ctx.body = { message: '验证码错误' }
        return
    }
    let adminInfo = await AdminUser.findOne({
        where: { 'email': username }
    })
    if (adminInfo === null) {
        const c = await AdminUser.count()
        if (c < 1) {
            adminInfo = await AdminUser.create({
                'email': username,
                'passwd': password,
            })
        } else {
            ctx.status = 400, ctx.body = { message: '用户不存在' }
            return
        }
    }
    if (adminInfo.passwd != password) {
        ctx.status = 400, ctx.body = { message: '密码错误' }
        return
    }
    ctx.body = {
        'token': 
            Jwt.sign({
                sub: adminInfo.id,
                exp: Math.floor(Date.now()/1000) + 86400 * 7
            },
            Config.secret
        )
    }
}

/**
 * 后台管理员列表
 */
export const adminList = async (ctx:Router.RouterContext) => {
    const page = Number(ctx.request.query.page)
    const limit = Number(ctx.request.query.limit) 
    const { rows, count } = await AdminUser.findAndCountAll({
        offset: page * limit - limit,
        limit: limit,
    })
    ctx.body = {
        data: rows,
        total: count
    }
}

/**
 * 管理员更新
 */
export const adminUpdate = async (ctx:Router.RouterContext) => {
    const {id, email, status, nickname } = ctx.request.body
    const adminInfo = await AdminUser.findByPk(id)
    if(adminInfo === null){
        ctx.state = 400, ctx.body = {'message':'用户不存在！'}
        return
    }
    adminInfo.email = email, adminInfo.status = status, adminInfo.nickname = nickname
    adminInfo.save()
    ctx.state = 200, ctx.body = {'message':'操作完成'}
    return
}

/**
 * 新增管理员
 */
export const adminCreate = async (ctx:Router.RouterContext) => {
    const {email, passwd, status, nickname } = ctx.request.body
    const adminInfo = await AdminUser.findOne({
        where:{email:email}
    })
    if (adminInfo !== null) {
        ctx.status = 400, ctx.body = {'message':'邮箱已存在！'}
        return
    }
    AdminUser.create({
        email: email,
        passwd: passwd,
        status: status,
        nickname: nickname,
    })
    ctx.status = 200, ctx.body = {'message':'创建成功！'}
    return
}

/**
 * 删除管理员
 */
export const adminDelete = async (ctx:Router.RouterContext) => {
    const id = ctx.request.query.id
    const adminInfo = await AdminUser.findByPk(Number(id))
    if(adminInfo === null){
        ctx.status = 400, ctx.body = {'message':'管理员不存在'}
        return
    }
    adminInfo.destroy()
    ctx.status = 200, ctx.body = {'message': adminInfo.email + '删除成功'}
    return
}