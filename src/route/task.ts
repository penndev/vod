import Router from "@koa/router"
import { ffmpegQueue } from "#queue/index.js"
import { Media } from "#orm/model.js"
import { randomstr } from "#util/index.js"


// 提交转码任务
// @param query id (媒体文件id)
export const taskHlsSubmit = async(ctx:Router.RouterContext) => {
    const id = Number(ctx.request.body.id)
    const data = await Media.findByPk(id)
    if (data == null){
        return
    }
    data.hlsPath = `data/${data.id}/hls/index.m3u8`
    data.hlsKey = randomstr(16)
    data.save()
    const queue = await ffmpegQueue.add({
        input: data.filePath,
        output: data.hlsPath,
        key: data.hlsKey, 
    })
    ctx.body = {
        jobId: queue.id,
        message: `转码任务为-> ${queue.id}`
    }
}

// 转码执行信息
// @param query id 任务id
export const taskHlsQuery = async(ctx:Router.RouterContext) => {
    if (typeof ctx.query.id !== "string") {
        return
    }
    const job = await ffmpegQueue.getJob(ctx.query.id)
    ctx.body = job
}



// 提交转码任务
// @param query id (媒体文件id)
export const taskMpegtsSubmit = async(ctx:Router.RouterContext) => {

}

// 转码执行信息
// @param query id 任务id
export const taskMpegtsQuery = async(ctx:Router.RouterContext) => {
    if (typeof ctx.query.id !== "string") {
        return
    }
    const job = await ffmpegQueue.getJob(ctx.query.id)
    ctx.body = job
}

