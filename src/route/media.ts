import Router from "@koa/router"
import { Media, MediaTs } from "../orm/model.js"
import { File } from 'formidable'
import { readFileSync, writeFileSync } from "fs"
import ffprobeQueue from "../queue/ffprobe.js"
import { ismkdir } from "../util/index.js"
import redis from "../redis/index.js"

/**上传媒体文件 */
interface uploadPart {
    totalSize: number;  // 总文件大小
    singleSize: number; // 单分片大小
    totalCount: number; // 共分了多少片 
    toCount: number; // 上传到了多少片
    fid: number;   // 文件ID 
    fmd5: string;  // 文件MD5
    fpath: string; // 文件存储路径
}

export class UploadMedia{

    static CacheKey(key:string){
        return 'upload-media-' + key 
    }

    /**
     * 上传文件前置创建文件
     * @param ctx 
     */
    static async Before (ctx: Router.RouterContext) {
        const { name, md5 } = ctx.request.body
        // const h = await redis.get(UploadMedia.CacheKey(md5))
        const cacheKey = UploadMedia.CacheKey(md5)
        // const cacheDate = await redis.hGetAll()
        redis.hGet()
        cacheDate
        console.log("penndev->", typeof cacheDate)
        // const mdata = cacheDate["penn"]

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

    /**
     * 上传分片文件，上传完成后合并
     * @param ctx 
     */
    static async Part (ctx: Router.RouterContext) {
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
}

/**
 * 媒体文件管理
 */
export class MediaController{
    /**
     * 媒体文件列表
     * @param ctx 
     */
    static async List (ctx: Router.RouterContext) {
        console.log(ctx.state)
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

    /**
     * 删除媒体文件
     */
    static async Delete (ctx: Router.RouterContext) {
        const id = ctx.request.query.id
        const mediaInfo = await Media.findByPk(Number(id))
        if(mediaInfo === null){
            ctx.status = 400, ctx.body = {'message':'数据不存在'}
            return
        }
        mediaInfo.destroy()
        ctx.status = 200, ctx.body = {'message': mediaInfo.fileName + '删除成功'}
        return
    }

}

/**
 * 切片管理列表
 */
export class MpegtsController{
    static async List (ctx: Router.RouterContext){
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
}
