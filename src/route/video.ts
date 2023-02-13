import Router from "@koa/router"
import redis from "../redis/index.js"
import config from "../config/index.js"
import { WhereOptions, Op, Order } from 'sequelize'

import { VideoFile, VideoTranscode } from "../orm/index.js"
import { File } from 'formidable'
import { readFileSync, unlink, writeFileSync } from "fs"
import { ffprobeQueue, ffmpegQueue, ffmpegInput } from "../queue/index.js"
import { ismkdir, parseNumber } from "../util/index.js"
import { VideoTask } from "../orm/model.js"
import { dirname, join } from "path/posix"


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

        const exist = await VideoFile.findOne({where:{ fileMd5:md5 } })
        if (exist != null){
            ctx.status = 400, ctx.body = {message:"文件已存在"}
            return 
        }

        const data = await VideoFile.create({
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
            const data = await VideoFile.findByPk(partData.fid)
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
export class VideoFileController{
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

        const { rows, count } = await VideoFile.findAndCountAll({
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
        const mediaInfo = await VideoFile.findByPk(id)
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
        const mediaInfo = await VideoFile.findByPk(Number(id))
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
 * 转码参数管理
 */
export class VideoTranscodeConroller{
    /**
     * 新增转码配置
     */
    static async Add (ctx: Router.RouterContext) {
        const {
            name,
            format,

            vcodec,
            vwidth,
            vheight,
            vcrf,
            vfps,
            vbitrate,

            acodec,
            abitrate,
            asamplerate,
            achannel,

            command
        } = ctx.request.body

        const data = await VideoTranscode.create({
            name,
            format,
            vcodec,
            vwidth,
            vheight,
            vcrf,
            vfps,
            vbitrate,
            acodec,
            abitrate,
            asamplerate,
            achannel,
            command
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
        const page = parseNumber(query.page,1)
        const limit = parseNumber(query.limit,20)        
        
        const where: WhereOptions = {} 
        if(query.name){
            where.name = {[Op.like]: '%' + query.name + '%'}
        }

        let order: Order = []
        if(query.order == "-id"){
            order = [['id','desc']]
        }

        const { rows, count } = await VideoTranscode.findAndCountAll({
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
        const { 
            id,  
            name,
            format,
            vcodec,
            // vwidth,
            // vheight,
            // vcrf,
            // vfps,
            // vbitrate,
            acodec,
            // abitrate,
            // asamplerate,
            // achannel,
            // command 
        } = ctx.request.body
        const vtinfo = await VideoTranscode.findByPk(id)
        if(vtinfo == null ){
            ctx.status = 400
            ctx.body = {'message':'ID不存在'}
            return
        }

        if(vtinfo.name != name){
            vtinfo.name = name
        }
        if(vtinfo.format != format){
            vtinfo.format = format
        }
        if(vtinfo.vcodec != vcodec){
            vtinfo.vcodec = vcodec
        }
        if(vtinfo.acodec != acodec){
            vtinfo.acodec = acodec
        }

        vtinfo.save()
        ctx.body = {'message':'修改完成'}
    }    


    /**
     * 删除媒体文件
     */
    static async Delete (ctx: Router.RouterContext) {
        const id = ctx.request.query.id
        const vfInfo = await VideoTranscode.findByPk(Number(id))
        if(vfInfo === null){
            ctx.status = 400, ctx.body = {'message':'数据不存在'}
            return
        }
        // 是否删除文件
        vfInfo.destroy()
        ctx.status = 200, ctx.body = {'message': vfInfo.name + '删除成功'}
        return
    }

}

/**
 * 提交转码任务管理
 */
export class VideoTaskController{
    /**
     * 新增转码任务
     */
    static async Add(ctx:Router.RouterContext){
        const { fileId, transcodeId, command, } = ctx.request.body
        const file = await VideoFile.findByPk(fileId)
        if(!file || file.status < 1){
            ctx.status = 400, ctx.body={"message":"文件不存在,或状态错误"}
            return 
        }
        const transcode = await VideoTranscode.findByPk(transcodeId)
        if(!transcode){
            ctx.status = 400, ctx.body={"message":"编码器不存在"}
            return 
        }

        // 处理其他更多的参数。
        const options:string[] = [`-vcodec ${transcode.vcodec}`,`-acodec ${transcode.acodec}`]
        // 编码器参数配置+覆盖。
        const mergeOptions = (transcode.command ?? '' ) + ";" + ( command ?? '' ) 
        for(let item of mergeOptions.split(";")){
            const option = item.trim()
            if(option) options.push(option)
        }

        // 新建表
        const task = await VideoTask.create({
            videoFileId:fileId,
            videoTranscodeId:transcodeId,
            options: JSON.stringify(options, null, 2),
            status:0,
        })
        task.outFile = join(dirname(file.filePath),`${task.id}/index.${transcode.format}`)
        await task.save()

        const finput:ffmpegInput = {
            inputFile: file?.filePath,
            options,
            outPutFile: task.outFile,
            taskId: task.id,
        }

        ctx.body = {
            "message": "提交完成",
            data: await ffmpegQueue.add(finput)
        }
    }

    /**
     * 转码配置列表
     */
    static async List (ctx: Router.RouterContext) {
        const query = ctx.request.query
        const page = parseNumber(query.page,1)
        const limit = parseNumber(query.limit,20)        
        
        const where: WhereOptions = {} 
        if(query.name){
            where.name = {[Op.like]: '%' + query.name + '%'}
        }

        let order: Order = []
        if(query.order == "-id"){
            order = [['id','desc']]
        }

        const { rows, count } = await VideoTask.findAndCountAll({
            offset: page * limit - limit,
            limit: limit,
            where,
            order,
            include:[
                { model: VideoFile },
                { model: VideoTranscode }
            ]
        })
        ctx.body = {
            data: rows,
            total: count
        }
    }


    // 查询任务进度
    static async Progress(ctx:Router.RouterContext){
        const job = await ffmpegQueue.getJob(ctx.query.id as string)
        ctx.body = job
    }
}