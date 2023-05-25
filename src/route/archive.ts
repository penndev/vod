import Router from '@koa/router'
import { parseNumber } from '../util/index.js'
import { Op, Order, WhereOptions } from 'sequelize'
import { ArchiveCategory, ArchiveList, ArchiveTag } from '../orm/index.js'

/**
 * 资料
 */
export class ArchiveListController {
  /**
   * 新增转码配置
   */
  static async Add (ctx: Router.RouterContext) {
    const {
      name
    } = ctx.request.body

    const data = await ArchiveList.create({
      name
    })

    ctx.body = {
      message: `${data.name}[${data.id}] 添加成功`
    }
  }

  /**
   * 转码配置列表
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

    const { rows, count } = await ArchiveList.findAndCountAll({
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
      name
    } = ctx.request.body
    const vtinfo = await ArchiveList.findByPk(id)
    if (vtinfo == null) {
      ctx.status = 400
      ctx.body = { message: 'ID不存在' }
      return
    }

    if (vtinfo.name !== name) {
      vtinfo.name = name
    }
    await vtinfo.save()
    ctx.body = { message: '修改完成' }
  }

  /**
   * 删除媒体文件
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
}

/**
 * 分类
 */
export class ArchiveCategoryController {
/**
   * 新增转码配置
   */
  static async Add (ctx: Router.RouterContext) {
    const {
      name
    } = ctx.request.body

    const data = await ArchiveCategory.create({
      name
    })

    ctx.body = {
      message: `${data.name}[${data.id}] 添加成功`
    }
  }

  /**
   * 转码配置列表
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
      name
    } = ctx.request.body
    const vtinfo = await ArchiveCategory.findByPk(id)
    if (vtinfo == null) {
      ctx.status = 400
      ctx.body = { message: 'ID不存在' }
      return
    }

    if (vtinfo.name !== name) {
      vtinfo.name = name
    }
    await vtinfo.save()
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
   * 新增转码配置
   */
  static async Add (ctx: Router.RouterContext) {
    const {
      name
    } = ctx.request.body

    const data = await ArchiveTag.create({
      name
    })

    ctx.body = {
      message: `${data.name}[${data.id}] 添加成功`
    }
  }

  /**
   * 转码配置列表
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
      name
    } = ctx.request.body
    const vtinfo = await ArchiveTag.findByPk(id)
    if (vtinfo == null) {
      ctx.status = 400
      ctx.body = { message: 'ID不存在' }
      return
    }

    if (vtinfo.name !== name) {
      vtinfo.name = name
    }
    await vtinfo.save()
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
