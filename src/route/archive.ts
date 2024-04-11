import Router from '@koa/router'
import { isMkdir, isUnlink, parseNumber } from '../util/index.js'
import { Op, Order, WhereOptions } from 'sequelize'
import { ArchiveCategory, ArchiveList, ArchiveTag, ArchiveTagMap } from '../orm/index.js'
import axios from 'axios'
import { randomUUID } from 'crypto'
import sharp from 'sharp'
import { writeFileSync } from 'fs'

/**
 * 资料
 */
export class ArchiveListController {
    /**
     * 下载封面图片并格式化为jpeg
     */
    static async downPic (picUri: string) {
        const result = await axios.get(picUri, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.95 Safari/537.36'
            },
            timeout: 30 * 1000,
            responseType: 'arraybuffer'
        })
        if (result.status === 200 && result.data) {
            return await sharp(result.data).withMetadata().jpeg({ quality: 100 }).toBuffer()
        }
        throw Error('获取图片失败')
    }

    /**
     * 新增资料列表
     */
    static async Add (ctx: Router.RouterContext) {
        const {
            archiveCategoryId, status, pic, name, sub, total, year, lang, area, content
        } = ctx.request.body

        // 首先验证图片
        const picBuffer = await ArchiveListController.downPic(pic)

        const data = await ArchiveList.create({
            archiveCategoryId, status, name, sub, total, year, lang, area, content
        })
        // 处理图片保存路径
        const newPic = `data/pic/${data.id}/${randomUUID()}.jpg`
        await isMkdir(newPic)
        writeFileSync(newPic, picBuffer)
        data.pic = newPic

        await data.save()

        ctx.body = {
            message: `${data.name} [${data.id}] 添加成功`
        }
    }

    /**
     * 获取资料列表
     */
    static async List (ctx: Router.RouterContext) {
        const query = ctx.request.query
        const page = parseNumber(query.page, 1)
        const limit = parseNumber(query.limit, 20)
        const updateStart = query.updateStart ?? ''
        const updateEnd = query.updateEnd ?? ''

        const where: WhereOptions = {}
        if (query.name) {
            where.name = { [Op.like]: '%' + query.name + '%' }
        }

        if (query.id) {
            where.id = query.id
        }

        if (query.status) {
            where.status = query.status
        }

        if (updateStart.length > 0 && updateEnd.length > 0) {
            where.updatedAt = {
                [Op.and]: [
                    { [Op.gt]: updateStart },
                    { [Op.lt]: updateEnd }
                ]
            }
        } else if (updateStart.length > 0) {
            where.updatedAt = { [Op.gt]: updateStart }
        } else if (updateEnd.length > 0) {
            where.updatedAt = { [Op.lt]: updateEnd }
        }

        let order: Order = []
        if (query.order === '-id') {
            order = [['id', 'desc']]
        }

        const { rows, count } = await ArchiveList.findAndCountAll({
            offset: page * limit - limit,
            limit,
            where,
            order
        })

        const host = `${ctx.request.protocol}://${ctx.request.host}`
        for (const al of rows) {
            al.setDataValue('Pic', al.pic ? host + '/' + al.pic : null)
            al.setDataValue('Tags', await ArchiveTagMap.findAll({
                where: { archiveListId: al.id },
                attributes: ['id'],
                include: {
                    model: ArchiveTag,
                    attributes: ['name']
                }
            }))
        }

        ctx.body = {
            data: rows,
            total: count
        }
    }

    /**
     * 修改资料内容
     */
    static async Update (ctx: Router.RouterContext) {
        let {
            id, archiveCategoryId, status, pic, name, sub, total, year, lang, area, content
        } = ctx.request.body
        const ALinfo = await ArchiveList.findByPk(id)
        if (ALinfo == null) {
            ctx.status = 400
            ctx.body = { message: 'ID不存在' }
            return
        }
        // 更新封面操作
        if (pic && (pic.startsWith('http://') || pic.startsWith('https://'))) {
            const picBuffer = await ArchiveListController.downPic(pic)
            pic = `data/pic/${ALinfo.id}/${randomUUID()}.jpg`
            await isMkdir(pic)
            writeFileSync(pic, picBuffer)
            isUnlink(ALinfo.pic).catch(e => {
                console.error(`isUnlink ${ALinfo.pic}`, e)
            })
        }
        await ALinfo.update({
            pic, archiveCategoryId, status, name, sub, total, year, lang, area, content
        })
        ctx.body = { message: '修改完成' }
    }

    /**
     * 删除资料内容
     */
    static async Delete (ctx: Router.RouterContext) {
        const id = ctx.request.query.id
        const data = await ArchiveList.findByPk(Number(id))
        if (data === null) {
            ctx.status = 400
            ctx.body = { message: '数据不存在' }
            return
        }
        await data.destroy()
        ctx.status = 200
        ctx.body = { message: data.name + '删除成功' }
    }

    /**
     * 将已存在的条目增加标签属性
     */
    static async AddTag (ctx: Router.RouterContext) {
        const {
            archiveTagId, archiveListId
        } = ctx.request.body
        // 判断是否存在
        if (await ArchiveTagMap.findOne({ where: { archiveTagId, archiveListId } }) !== null) {
            ctx.status = 400
            ctx.body = { message: '已存在标签' }
            return
        }

        const data = await ArchiveTagMap.create({
            archiveTagId, archiveListId
        })
        await data.save()

        ctx.body = {
            data,
            message: '添加成功'
        }
    }

    /**
     * 删除某个资料的标签内容
     */
    static async DeleteTag (ctx: Router.RouterContext) {
        const id = ctx.request.query.id
        const data = await ArchiveTagMap.findByPk(Number(id))
        if (data === null) {
            ctx.status = 400
            ctx.body = { message: '数据不存在' }
            return
        }
        await data.destroy()
        ctx.status = 200
        ctx.body = { message: '删除成功' }
    }
}

/**
 * 分类
 */
export class ArchiveCategoryController {
    /**
     * 新增
     */
    static async Add (ctx: Router.RouterContext) {
        const {
            parent, status, name, content, order
        } = ctx.request.body
        if (parent > 0) {
            const ptInfo = await ArchiveCategory.findByPk(parent)
            if (ptInfo == null || ptInfo.parent !== 0) {
                ctx.status = 400
                ctx.body = { message: '父级分类不规范' }
                return
            }
        }
        const data = await ArchiveCategory.create({
            parent, status, name, content, order
        })

        ctx.body = {
            message: `${data.name}[${data.id}] 添加成功`
        }
    }

    /**
     * 列表
     */
    static async List (ctx: Router.RouterContext) {
        const query = ctx.request.query
        const page = parseNumber(query.page, 1)
        const limit = parseNumber(query.limit, 20)

        const where: WhereOptions = {}
        if (query.name) {
            where.name = { [Op.like]: '%' + query.name + '%' }
        }

        let order: Order = []
        if (query.order === '-id') {
            order = [['id', 'desc']]
        }

        const { rows, count } = await ArchiveCategory.findAndCountAll({
            offset: page * limit - limit,
            limit,
            where,
            order
        })
        ctx.body = {
            data: rows,
            total: count
        }
    }

    /**
     * 修改文件内容
     */
    static async Update (ctx: Router.RouterContext) {
        const {
            id,
            parent, status, name, content, order
        } = ctx.request.body
        const acInfo = await ArchiveCategory.findByPk(id)
        if (acInfo == null) {
            ctx.status = 400
            ctx.body = { message: 'ID不存在' }
            return
        }
        if (parent > 0) {
            const ptInfo = await ArchiveCategory.findByPk(parent)
            if (ptInfo == null || ptInfo.parent !== 0) {
                ctx.status = 400
                ctx.body = { message: '父级分类不规范' }
                return
            }
        }
        await acInfo.update({ parent, status, name, content, order })
        ctx.body = { message: '修改完成' }
    }

    /**
     * 删除媒体文件
     */
    static async Delete (ctx: Router.RouterContext) {
        const id = ctx.request.query.id
        const data = await ArchiveCategory.findByPk(Number(id))
        if (data === null) {
            ctx.status = 400
            ctx.body = { message: '数据不存在' }
            return
        }
        const childItem = await ArchiveCategory.findOne({
            where: {
                parent: id
            }
        })
        if (childItem !== null) {
            ctx.status = 400
            ctx.body = { message: '请先处理下级分类' }
            return
        }
        await data.destroy()
        ctx.status = 200
        ctx.body = { message: data.name + '删除成功' }
    }
}

/**
 * 标签
 */
export class ArchiveTagController {
    /**
     * 新增
     */
    static async Add (ctx: Router.RouterContext) {
        const {
            status, name, content, hits
        } = ctx.request.body

        const data = await ArchiveTag.create({
            status, name, content, hits
        })

        ctx.body = {
            message: `${data.name}[${data.id}] 添加成功`
        }
    }

    /**
     * 列表
     */
    static async List (ctx: Router.RouterContext) {
        const query = ctx.request.query
        const page = parseNumber(query.page, 1)
        const limit = parseNumber(query.limit, 20)

        const where: WhereOptions = {}
        if (query.name) {
            where.name = { [Op.like]: '%' + query.name + '%' }
        }

        let order: Order = []
        if (query.order === '-id') {
            order = [['id', 'desc']]
        }

        const { rows, count } = await ArchiveTag.findAndCountAll({
            offset: page * limit - limit,
            limit,
            where,
            order
        })
        ctx.body = {
            data: rows,
            total: count
        }
    }

    /**
     * 修改文件内容
     */
    static async Update (ctx: Router.RouterContext) {
        const {
            id,
            status, name, content, hits
        } = ctx.request.body

        const atinfo = await ArchiveTag.findByPk(id)
        if (atinfo == null) {
            ctx.status = 400
            ctx.body = { message: 'ID不存在' }
            return
        }

        await atinfo.update({ status, name, content, hits })

        ctx.body = { message: '修改完成' }
    }

    /**
     * 删除媒体文件
     */
    static async Delete (ctx: Router.RouterContext) {
        const id = ctx.request.query.id
        const data = await ArchiveTag.findByPk(Number(id))
        if (data === null) {
            ctx.status = 400
            ctx.body = { message: '数据不存在' }
            return
        }
        await data.destroy()
        ctx.status = 200
        ctx.body = { message: data.name + '删除成功' }
    }
}
