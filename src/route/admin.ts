import Router from '@koa/router'
import Captcha from 'svg-captcha'
import Redis from '../redis/index.js'
import { randomUUID } from 'crypto'
import { AdminUser } from '../orm/index.js'
import Jwt from 'jsonwebtoken'
import config from '../config/index.js'

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
                exp: Math.floor(Date.now()/1000) + 60//86400 * 7
            },
            config.secret
        )
    }
}
