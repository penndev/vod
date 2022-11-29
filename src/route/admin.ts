import Router from "@koa/router"
import Captcha from 'svg-captcha'
import Redis from '#redis/index.js'
import { randomUUID } from "crypto"
import { AdminUser } from "#orm/index.js"

export const captcha = async (ctx: Router.RouterContext) => {
    const imgdata = Captcha.create()
    const uuid = randomUUID()
    const captchakey = 'captcha-' + uuid
    Redis.set(captchakey, imgdata.text, { EX: 60 })
    ctx.body = {
        captchaURL: `data:image/svg+xml;base64,${Buffer.from(imgdata.data, "binary").toString('base64')}`,
        captchaID: uuid
    }
}

export const login = async (ctx: Router.RouterContext) => {
    const { captchaID, captcha, username, password } = ctx.request.body
    const captchakey = "captcha-" + captchaID
    const text = await Redis.get(captchakey)
    if (text !== captcha) {
        ctx.status = 400
        ctx.body = { message: "验证码错误" }
        return
    }
    let au = await AdminUser.findOne({
        where: { "email": username }
    })
    // 用户不存在
    if (au === null) {
        const auc = await AdminUser.count()
        if (auc === 0) {
            au = await AdminUser.create({
                "email": username,
                "passwd": password,
            })
        } else {
            ctx.status = 400, ctx.body = { message: "用户不存在" }
            return
        }
    }
    if (au.passwd != password) {
        ctx.status = 400, ctx.body = { message: "密码错误" }
        return
    }
    ctx.body = {
        "token": au.id
    }
}
