import Router from "@koa/router"
import { Media, MediaTs } from "../orm/model.js"
import { File } from 'formidable'
import { readFileSync, renameSync, unlink, writeFileSync } from "fs"
import ffprobeQueue from "../queue/ffprobe.js"
import { ismkdir, parseNumber } from "../util/index.js"
import redis from "../redis/index.js"
import config from "../config/index.js"
import { WhereOptions, Op, Order } from 'sequelize'

/**上传媒体文件限制大小 */
const urate = 5 * 1048576

/**上传媒体文件 */
interface uploadPart {
    fid: number; //存储文件ID
    fpath: string; //存储文件路径
    fsize: number; //文件总大小
    urate: number; //单分片大小,上传速率
    ucount: number; //已经上传了多少次 
}

/**
 * 文件上传处理
 */
export class UploadMedia{
    /**
     * 上传文件前置创建文件
     */
    static async Before (ctx: Router.RouterContext) {
        const { name, md5, size } = ctx.request.body
        if(!name || !md5 || !size){
            ctx.status = 400
            ctx.body = {message:"缺少参数"}
            return
        }

        const cacheKey = `upload-${md5}`
        const cacheData = await redis.GET(cacheKey)
        if(cacheData){
            ctx.body = JSON.parse(cacheData) as uploadPart
            return 
        }

        const exist = await Media.findOne({where:{ fileMd5:md5 } })
        if (exist != null){
            ctx.status = 400, ctx.body = {message:"文件已存在"}
            return 
        }

        const data = await Media.create({
            fileName:name,
            fileMd5:md5,
            fileSize:size,
            status:0,
            node: config.node,
        })
        await data.update({
            filePath: `data/${config.node}/media/${data.fileMd5.slice(0,3)}/${data.fileMd5}/${data.fileName}`
        })
        //清理掉历史遗留文件
        unlink(data.filePath,(e)=>{})
        const partData: uploadPart = {
            fid: data.id,
            fpath: data.filePath,
            fsize: data.fileSize,
            urate,
            ucount: 0,
        }
        redis.SET(cacheKey,JSON.stringify(partData),{EX:86400})
        ctx.body = partData
    }

    /**
     * 上传分片文件，上传完成后合并
     */
    static async Part (ctx: Router.RouterContext) {
        // 当前分片编号1开始，总分片数量，上传ID, 上传数据
        const { currentPart, uploadID } = ctx.request.body
        const uploadData = ctx.request.files?.uploadData
        if( currentPart === undefined || !uploadID || typeof uploadData !== "object" ){
            ctx.status = 400
            ctx.body = {message:"缺少参数"}
            return
        }
        
        const cacheKey = `upload-${uploadID}`
        const cacheData = await redis.GET(cacheKey)
        if(!cacheData){
            ctx.status = 400
            ctx.body = {message:"redisgetfile失败"}
            return
        }
        const partData:uploadPart = JSON.parse(cacheData)
        if(partData.ucount !== parseInt(currentPart)){
            ctx.status = 400
            ctx.body = {message:"currentPart失败"}
            return
        }
        const reader = readFileSync((uploadData as File).filepath)
        await ismkdir(partData.fpath)
        writeFileSync(partData.fpath,reader,{flag:"a+"})
        partData.ucount = parseInt(currentPart) + 1
        await redis.SET(cacheKey,JSON.stringify(partData),{EX:86400})

        // 判断是否是最后一次上传.
        const totalPart = Math.ceil(partData.fsize/partData.urate)
        if(partData.ucount === totalPart){ // 查验文件信息
            const data = await Media.findByPk(partData.fid)
            ffprobeQueue.add(data)
            await redis.DEL(cacheKey)
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
     */
    static async List (ctx: Router.RouterContext) {
        const query = ctx.request.query
        const page = parseNumber(query.page,1)
        const limit = parseNumber(query.limit,20)        
        
        const where: WhereOptions = {} 
        if(query.fileName){
            where.fileName = {[Op.like]: '%' + query.fileName + '%'}
        }
        if(query.fileMd5){
            where.fileMd5 = query.fileMd5
        }

        let order: Order = []
        if(query.order == "-id"){
            order = [['id','desc']]
        }

        const { rows, count } = await Media.findAndCountAll({
            offset: page * limit - limit,
            limit: limit,
            where,
            order,
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
        // const id = parseNumber(ctx.request.body.id,0)
        const { id,fileName } = ctx.request.body
        const mediaInfo = await Media.findByPk(id)
        if(mediaInfo == null ){
            ctx.status = 400
            ctx.body = {'message':'ID不存在'}
            return
        }

        if(mediaInfo.fileName != fileName){
            // 修改文件名 不修改文件名，防止-
            // const filePath = mediaInfo.filePath.replace(mediaInfo.fileName,fileName)
            // renameSync(mediaInfo.filePath,filePath)
            // mediaInfo.filePath = filePath
            mediaInfo.fileName = fileName
        }
        mediaInfo.save()
        ctx.body = {'message':'修改完成'}
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
        // 是否删除文件
        mediaInfo.destroy()
        ctx.status = 200, ctx.body = {'message': mediaInfo.fileName + '删除成功'}
        return
    }

}

/**
 * 切片管理列表
 */
export class MediaTsController{
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

/**
 * 提交定时任务
 */
export class MediaTaskController{
    static async ffmpegSubmit(ctx:Router.RouterContext){
        // const id = Number(ctx.request.body.id)
        // const data = await Media.findByPk(id)
        // if (data == null){
        //     return
        // }
        // data.hlsPath = `data/${data.id}/hls/index.m3u8`
        // data.hlsKey = randomstr(16)
        // data.save()
        // const queue = await ffmpegQueue.add(data)
        // ctx.body = {
        //     jobId: queue.id,
        //     message: `转码任务为-> ${queue.id}`
        // }
    }
}