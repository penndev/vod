import Router from "@koa/router"
import { Media } from "#orm/model.js"
import { File } from 'formidable'
import { readFileSync, writeFileSync } from "fs"
import ffprobeQueue from "#queue/ffprobe.js"
import { ismkdir } from "#util/index.js"

export const uploadPart = async(ctx: Router.RouterContext)=>{
    // 当前分片编号1开始，总分片数量，上传ID, 上传数据
    const { currentPart,countPart,uploadID } = ctx.request.body
    const  uploadData  = ctx.request.files?.uploadData
    if (typeof uploadData !== "object"){
        return
    }

    const data = await Media.findByPk(uploadID)
    if(typeof data?.filename !== "string" ){
        return
    }

    const filepath = `data/${data.id}/${data.filename}`
    const reader = readFileSync((uploadData as File).filepath)
    await ismkdir(filepath)
    writeFileSync(filepath,reader,{flag:"a+"})

    // 判断是否是最后一次上传。修改文件状态。
    if(currentPart === countPart){
        // 查验文件信息
        data.filepath = filepath
        data.save()
        ffprobeQueue.add(data)
    }

    ctx.body = {
        "message": "ok"
    }
}

export const uploadBefore = async(ctx: Router.RouterContext) => {
    const { name, md5 } = ctx.request.body
    const data = await Media.create({
        filename: name,
        filemd5: md5,
    })
    // 如果数据存在，则开始指定的切片。计数从1开始
    ctx.body = {
        id: data.id,
        currentPart:1,
    }
}