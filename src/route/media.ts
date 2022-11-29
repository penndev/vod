import Router from "@koa/router"
import { Media, MediaTs } from "#orm/model.js"
import { File } from 'formidable'
import { readFileSync, writeFileSync } from "fs"
import ffprobeQueue from "#queue/ffprobe.js"
import { ismkdir } from "#util/index.js"

export const mediaUploadPart = async(ctx: Router.RouterContext)=>{
    // 当前分片编号1开始，总分片数量，上传ID, 上传数据
    const { currentPart,countPart,uploadID } = ctx.request.body
    const  uploadData  = ctx.request.files?.uploadData
    
    if (typeof uploadData !== "object"){
        ctx.status = 400
        ctx.body = {message:"未上传文件"}
        return
    }
    const data = await Media.findByPk(uploadID)
    if(data === null ){
        ctx.status = 400
        ctx.body = {message:"未选择数据"}
        return
    }

    const filepath = `data/${data.id}/${data.fileName}`
    const reader = readFileSync((uploadData as File).filepath)
    await ismkdir(filepath)
    writeFileSync(filepath,reader,{flag:"a+"})

    // 判断是否是最后一次上传。修改文件状态。
    if(currentPart === countPart){
        // 查验文件信息
        data.filePath = filepath
        data.save()
        ffprobeQueue.add(data)
    }

    ctx.body = {
        "message": "ok"
    }
}

export const mediaUploadBefore = async(ctx: Router.RouterContext) => {
    const { name, md5 } = ctx.request.body
    const data = await Media.create({
        fileName: name,
        fileMd5: md5,
    })
    // 如果数据存在，则开始指定的切片。计数从1开始
    ctx.body = {
        id: data.id,
        currentPart:1,
    }
}

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

export const mediaMpegtsList = async (ctx: Router.RouterContext) => {
    const page = Number(ctx.request.query.page)
    const limit = Number(ctx.request.query.limit) 
    const { rows, count } = await MediaTs.findAndCountAll({
        offset: page * limit - limit,
        limit: limit,
    })
    ctx.body = {
        data: rows,
        total: count
    }
}
