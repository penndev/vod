import Router from '@koa/router'
import Captcha from 'svg-captcha'
import Redis from '../redis/index.js'
import { randomUUID } from 'crypto'
import { Admin, AdminAccessLog, Role } from '../orm/index.js'
import Jwt from 'jsonwebtoken'
import Config from '../config/index.js'
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
    const text = await Redis.getDel(captchaID)
    if (text !== captcha) {
        ctx.status = 400, ctx.body = { message: '验证码错误' }
        return
    }
    let adminInfo = await Admin.findOne({
        where: { 'email': username }
    })
    if (adminInfo === null) {
        const c = await Admin.count()
        if (c < 1) {
            const saltRound = await Bcrypt.genSalt(10)
            adminInfo = await Admin.create({
                email: username,
                passwd: await Bcrypt.hash(password,saltRound),
                status: 1,
                nickname: 'admin',
            })
        } else {
            ctx.status = 400, ctx.body = { message: '用户不存在' }
            return
        }
    }
    if (! await Bcrypt.compare(password,adminInfo.passwd)) {
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
    
    const whereArr: WhereOptions = {} 
    const email = ctx.request.query.email
    if(email !== undefined){
        whereArr.email = {[Op.like]: '%' + email + '%'}
    }

    const { rows, count } = await Admin.findAndCountAll({
        attributes: { exclude: ['passwd'] },
        offset: page * limit - limit,
        limit: limit,
        where: whereArr,
    })
    for(const row of rows){
        if(row.roleId == 0){
            row.roleName = '超级管理员'
        }else {
            row.roleName = '权限名称'
        }
    }
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
    const adminInfo = await Admin.findByPk(id)
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
    const adminInfo = await Admin.findOne({
        where:{email:email}
    })
    if (adminInfo !== null) {
        ctx.status = 400, ctx.body = {'message':'邮箱已存在！'}
        return
    }
    const saltRound = await Bcrypt.genSalt(10)
    Admin.create({
        email: email,
        passwd: await Bcrypt.hash(passwd,saltRound),
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
    const adminInfo = await Admin.findByPk(Number(id))
    if(adminInfo === null){
        ctx.status = 400, ctx.body = {'message':'管理员不存在'}
        return
    }
    adminInfo.destroy()
    ctx.status = 200, ctx.body = {'message': adminInfo.email + '删除成功'}
    return
}


/**
 * 后台管理员列表
 */
export const roleList = async (ctx:Router.RouterContext) => {
    const page = Number(ctx.request.query.page)
    const limit = Number(ctx.request.query.limit)
    
    const whereArr: WhereOptions = {} 
    const name = ctx.request.query.name
    if(name !== undefined){
        whereArr.name = {[Op.like]: '%' + name + '%'}
    }

    const { rows, count } = await Role.findAndCountAll({
        offset: page * limit - limit,
        limit: limit,
        where: whereArr,
    })
    for(const i of rows){
        i.route = JSON.parse(i.route)
    }
    ctx.body = {
        data: rows,
        total: count
    }
}

/**
 * 管理员更新
 */
export const roleUpdate = async (ctx:Router.RouterContext) => {
    const { id, name, status, menu, route } = ctx.request.body
    const roleInfo = await Role.findByPk(id)
    if(roleInfo === null){
        ctx.state = 400, ctx.body = {'message':'用户不存在！'}
        return
    }
    roleInfo.name = name, 
    roleInfo.status = status,
    roleInfo.menu = menu, 
    roleInfo.route = JSON.stringify(route),
    roleInfo.save()
    ctx.state = 200, ctx.body = {'message':'操作完成'}
    return
}

/**
 * 新增管理员
 */
export const roleCreate = async (ctx:Router.RouterContext) => {
    const {name, status, menu, route } = ctx.request.body
    const roleInfo = await Role.findOne({
        where:{name}
    })
    if (roleInfo !== null) {
        ctx.status = 400, ctx.body = {'message':'角色已存在！'}
        return
    }
    const routeJson = JSON.stringify(route)
    Role.create({
        name,
        status,
        menu,
        route: routeJson,
    })
    ctx.status = 200, ctx.body = {'message':'创建成功！'}
    return
}

/**
 * 删除管理员
 */
export const roleDelete = async (ctx:Router.RouterContext) => {
    const id = ctx.request.query.id
    const roleInfo = await Role.findByPk(Number(id))
    if(roleInfo === null){
        ctx.status = 400, ctx.body = {'message':'管理员不存在'}
        return
    }
    roleInfo.destroy()
    ctx.status = 200, ctx.body = {'message': roleInfo.name + '删除成功'}
    return
}




/**
 * 管理员操作日志
 */
export const accessLog = async (ctx: Router.RouterContext) => {
    const page = Number(ctx.request.query.page)
    const limit = Number(ctx.request.query.limit)
    const offset = (page || 1) * limit - limit
    /**
     * Where 条件
     */
    const where : WhereOptions = {}
    const adminID = ctx.request.query.admin
    if(adminID !== undefined){
        where.admin = adminID
    }
    /**
     * Order 条件
     */
    let order:Order = []
    if (ctx.request.query.order !== undefined){
        switch(ctx.request.query.order){
            case '+id':
                order = [['id','ASC']]
                break
            case '-id' :
                order = [['id','DESC']] 
                break
        }
    }

    const { rows, count } = await AdminAccessLog.findAndCountAll({
        offset, limit, where, order
    })
    ctx.body = {
        data: rows,
        total: count
    }
}