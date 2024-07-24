import Router from '@koa/router'
import Captcha from 'svg-captcha'
import Redis from '../redis/index.js'
import { randomUUID } from 'crypto'
import { AdminUser, AdminAccessLog, AdminRole } from '../orm/index.js'
import Jwt from 'jsonwebtoken'
import config from '../config/index.js'
import Bcrypt from 'bcrypt'
import { Order, WhereOptions, Op } from 'sequelize'

/**
 * 获取系统验证码
 * @param ctx
 */
export const captcha = async (ctx: Router.RouterContext) => {
    const uuid = 'captcha-' + randomUUID()
    const imgdata = Captcha.create({
        charPreset: '1234567890',
        noise: 8,
        size: 4
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
    const text = await Redis.getDel(captchaID)
    if (text !== captcha) {
        ctx.status = 400
        ctx.body = { message: '验证码错误' }
        return
    }
    let adminInfo = await AdminUser.findOne({
        where: { email: username }
    })
    if (adminInfo === null) {
        const c = await AdminUser.count()
        if (c < 1) {
            const saltRound = await Bcrypt.genSalt(10)
            adminInfo = await AdminUser.create({
                email: username,
                passwd: await Bcrypt.hash(password, saltRound),
                status: 1,
                adminRoleId: 0,
                nickname: 'admin'
            })
        } else {
            ctx.status = 400
            ctx.body = { message: '用户不存在' }
            return
        }
    }
    if (!await Bcrypt.compare(password, adminInfo.passwd)) {
        ctx.status = 400
        ctx.body = { message: '密码错误' }
        return
    }
    let routes: string|string[] = '*'
    if (adminInfo.adminRoleId > 0) {
        const role = await AdminRole.findByPk(adminInfo.adminRoleId)
        if (role === null) {
            ctx.status = 400
            ctx.body = { message: '密码错误' }
            return
        }
        routes = role.menu
    }

    ctx.body = {
        token:
            Jwt.sign(
                {
                    sub: adminInfo.id,
                    exp: Math.floor(Date.now() / 1000) + 86400 * 7
                },
                config.secret
            ),
        routes
    }
}

/**
 * 管理员管理
 */
export class AdminController {
    /**
     * 管理员列表
     */
    static async List (ctx: Router.RouterContext) {
        const page = Number(ctx.request.query.page)
        const limit = Number(ctx.request.query.limit)

        const whereArr: WhereOptions = {}
        const email = ctx.request.query.email
        if (email !== undefined) {
            whereArr.email = { [Op.like]: '%' + email + '%' }
        }

        const { rows, count } = await AdminUser.findAndCountAll({
            attributes: { exclude: ['passwd'] },
            offset: page * limit - limit,
            limit,
            where: whereArr,
            include: [
                { model: AdminRole }
            ]
        })
        ctx.body = {
            data: rows,
            total: count
        }
    }

    /**
     * 管理员更新
     */
    static async Update (ctx: Router.RouterContext) {
        const { id, email, status, nickname, roleId } = ctx.request.body
        const adminInfo = await AdminUser.findByPk(id)
        if (adminInfo === null) {
            ctx.status = 400
            ctx.body = { message: '用户不存在！' }
            return
        }
        if (roleId < 1) {
            ctx.status = 400
            ctx.body = { message: '权限错误！' }
            return
        }
        adminInfo.update({
            email,
            status,
            nickname,
            roleId
        })
        ctx.body = { message: '操作完成' }
    }

    /**
     * 新增管理员
     */
    static async Create (ctx: Router.RouterContext) {
        const { email, passwd, status, adminRoleId, nickname } = ctx.request.body
        const adminInfo = await AdminUser.findOne({
            where: { email }
        })
        if (adminInfo !== null) {
            ctx.status = 400
            ctx.body = { message: '邮箱已存在！' }
            return
        }
        if (adminRoleId < 1) {
            ctx.status = 400
            ctx.body = { message: '权限错误！' }
            return
        }

        const saltRound = await Bcrypt.genSalt(10)
        await AdminUser.create({
            email,
            passwd: await Bcrypt.hash((passwd || '123456'), saltRound),
            status,
            nickname: nickname || '默认用户',
            adminRoleId
        })
        ctx.body = { message: '创建成功！' }
    }

    /**
     * 删除管理员
     */
    static async Delete (ctx: Router.RouterContext) {
        const id = ctx.request.query.id
        const adminInfo = await AdminUser.findByPk(Number(id))
        if (adminInfo === null) {
            ctx.status = 400
            ctx.body = { message: '管理员不存在' }
            return
        }
        if (adminInfo.adminRoleId < 1) {
            ctx.status = 400
            ctx.body = { message: '无权操作' }
            return
        }
        await adminInfo.destroy()
        ctx.body = { message: adminInfo.email + '删除成功' }
    }

    /**
     * 管理员操作日志
     */
    static async AccessLog (ctx: Router.RouterContext) {
        const page = Number(ctx.request.query.page)
        const limit = Number(ctx.request.query.limit)
        const offset = (page || 1) * limit - limit
        /**
         * Where 条件
         */
        const where: WhereOptions = {}
        const adminID = ctx.request.query.admin
        if (adminID !== undefined) {
            where.admin = adminID
        }
        /**
         * Order 条件
         */
        let order: Order = []
        if (ctx.request.query.order !== undefined) {
            switch (ctx.request.query.order) {
            case '+id':
                order = [['id', 'ASC']]
                break
            case '-id':
                order = [['id', 'DESC']]
                break
            }
        }

        const { rows, count } = await AdminAccessLog.findAndCountAll({
            offset, limit, where, order, include: [{ model: AdminUser }]
        })
        ctx.body = {
            data: rows,
            total: count
        }
    }
}

/**
 * 权限管理
 */
export class RoleController {
    /**
     * 权限列表
     */
    static async List (ctx: Router.RouterContext) {
        const page = Number(ctx.request.query.page)
        const limit = Number(ctx.request.query.limit)

        const whereArr: WhereOptions = {}
        const name = ctx.request.query.name
        if (name !== undefined) {
            whereArr.name = { [Op.like]: '%' + name + '%' }
        }

        const { rows, count } = await AdminRole.findAndCountAll({
            offset: page * limit - limit,
            limit,
            where: whereArr
        })
        ctx.body = {
            data: rows,
            total: count
        }
    }

    /**
     * 更新权限
     */
    static async Update (ctx: Router.RouterContext) {
        const { id, name, status, menu, route } = ctx.request.body
        const roleInfo = await AdminRole.findByPk(id)
        if (roleInfo === null) {
            ctx.status = 400
            ctx.body = { message: '用户不存在！' }
            return
        }
        roleInfo.name = name
        roleInfo.status = status
        roleInfo.menu = menu
        roleInfo.route = route
        await roleInfo.save()
        ctx.body = { message: '操作完成' }
    }

    /**
     * 新增权限
     */
    static async Create (ctx: Router.RouterContext) {
        const { name, status, menu, route } = ctx.request.body
        const roleInfo = await AdminRole.findOne({
            where: { name }
        })
        if (roleInfo !== null) {
            ctx.status = 400
            ctx.body = { message: '角色已存在！' }
            return
        }
        await AdminRole.create({
            name,
            status,
            menu,
            route
        })
        ctx.body = { message: '创建成功！' }
    }

    /**
     * 删除权限
     */
    static async Delete (ctx: Router.RouterContext) {
        const id = ctx.request.query.id
        const roleInfo = await AdminRole.findByPk(Number(id))
        if (roleInfo === null) {
            ctx.status = 400
            ctx.body = { message: '管理员不存在' }
            return
        }
        await roleInfo.destroy()
        ctx.body = { message: roleInfo.name + '删除成功' }
    }
}
