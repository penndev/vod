import Router from "@koa/router"
import { Media } from "#orm/model.js"

export const submitMpegts = async(ctx: Router.RouterContext) => {
    const mediaId = Number(ctx.request.query.id)
    
}