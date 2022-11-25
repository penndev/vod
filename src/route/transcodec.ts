import Router from "@koa/router"
import { ffmpegQueue } from "#queue/index.js"
import { Media } from "../orm/model.js"
import { randomstr } from "../util/index.js"

export const submitTransCodec = async(ctx:Router.RouterContext) => {
    const id = Number(ctx.request.body.id)
    const data = await Media.findByPk(id)
    if (data == null){
        return
    }
    data.hlspath = `data/${data.id}/hls/index.m3u8`
    data.hlskey = randomstr(16)
    data.save()
    const queue = await ffmpegQueue.add({
        input: data.filepath,
        output: data.hlspath,
        key: data.hlskey, 
    })
    ctx.body = {
        jobId: queue.id
    }
}

export const queryTransCodec = async(ctx:Router.RouterContext) => {
    if (typeof ctx.query.id !== "string") {
        return
    }
    const job = await ffmpegQueue.getJob(ctx.query.id)
    ctx.body = job
}
