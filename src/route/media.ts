import Router from "@koa/router"
import { Media } from "#orm/model.js"


export const mediaList = async (ctx: Router.RouterContext) => {
    const page = Number(ctx.request.query.page)
    const limit = Number(ctx.request.query.limit) 
    const { rows, count } = await Media.findAndCountAll({
        offset: page * limit - limit,
        limit: limit,
    })
    ctx.body = {
        data: rows,
        total: count
    }
}
