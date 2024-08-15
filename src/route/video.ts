import Router from '@koa/router'
import Redis from '../config/redis.js'
import transcodeChannel from '../queue/transcode.js'

import { WhereOptions, Op, Order } from 'sequelize'
import { VideoFile, VideoTranscode, VideoTask } from '../orm/index.js'
import { File } from 'formidable'
import { readFileSync, unlinkSync, writeFileSync } from 'fs'
import { isMkdir, isUnlink, md5LargeFile, parseNumber } from '../util/index.js'
import { dirname, join } from 'path/posix'
import { ffprobeDataJson } from '../util/vod.js'

/** 上传媒体文件 */
interface uploadPart {
    id: number // 存储文件ID
    path: string // 存储文件路径
    size: number // 文件总大小
    partSize: number // 单分片大小,上传速率
    partCount: number // 已经上传了多少次
}

/**
 * 文件上传处理
 */
export class UploadMedia {
    /**
     * 上传文件前置创建文件
     */
    static async Before (ctx: Router.RouterContext) {
        const { name, md5, size } = ctx.request.body
        if (!name || !md5 || !size) {
            ctx.status = 400
            ctx.body = { message: '缺少参数' }
            return
        }

        const cacheKey = `upload:${md5}`
        const cacheData = await Redis.get(cacheKey)
        if (cacheData) {
            ctx.body = JSON.parse(cacheData) as uploadPart
            return
        }

        const exist = await VideoFile.findOne({ where: { fileMd5: md5 } })
        if (exist != null) {
            ctx.status = 400
            ctx.body = { message: '文件已存在' }
            return
        }

        const vf = await VideoFile.create({
            fileName: name,
            fileMd5: md5,
            fileSize: size,
            status: 0
        })
        await vf.update({
            filePath: `data/video/${vf.fileMd5.slice(0, 3)}/${vf.fileMd5}/${vf.fileName}`
        })
        // 清理掉历史遗留文件
        await isUnlink(vf.filePath)
        const partData: uploadPart = {
            id: vf.id,
            path: vf.filePath,
            size: vf.fileSize,
            partSize: 5 * 1048576,
            partCount: 0
        }
        await Redis.set(cacheKey, JSON.stringify(partData), { EX: 86400 })
        ctx.body = partData
    }

    /**
     * 上传分片文件，上传完成后合并
     */
    static async Part (ctx: Router.RouterContext) {
        const { currentPart, uploadID } = ctx.request.body
        const uploadData = ctx.request.files?.uploadData
        if (currentPart === undefined || !uploadID || typeof uploadData !== 'object') {
            ctx.status = 400
            ctx.body = { message: '缺少参数' }
            return
        }

        const cacheKey = `upload:${uploadID}`
        const cacheData = await Redis.get(cacheKey)
        if (!cacheData) {
            ctx.status = 400
            ctx.body = { message: 'redisgetfile失败' }
            return
        }
        const partData:uploadPart = JSON.parse(cacheData)
        if (partData.partCount !== parseInt(currentPart)) {
            ctx.status = 400
            ctx.body = { message: 'currentPart失败' }
            return
        }
        const uploadFilePath = (uploadData as File).filepath
        const reader = readFileSync(uploadFilePath)
        if (partData.partCount === 0) await isMkdir(partData.path)
        writeFileSync(partData.path, reader, { flag: 'a+' })
        unlinkSync(uploadFilePath) // 删除临时文件，某些系统不会自己删除。
        partData.partCount = parseInt(currentPart) + 1
        await Redis.set(cacheKey, JSON.stringify(partData), { EX: 86400 })

        // 判断是否是最后一次上传.
        const totalPart = Math.ceil(partData.size / partData.partSize)
        if (partData.partCount === totalPart) { // 查验文件信息
            const vf = await VideoFile.findByPk(partData.id)
            if (vf == null) {
                ctx.status = 400
                ctx.body = { message: '原文件id找不到!' }
                return
            }
            // 超过10G的文件可能会造成请求超时。
            // 可以使用队列进行后续的操作，根据实际情况来操作。
            // 必须保证发送任务和接收任务是同一节点。
            const md5 = await md5LargeFile(vf.filePath)
            if (vf.fileMd5 !== md5) {
                vf.status = -1
                await vf.save()
                await Redis.del(cacheKey)
                ctx.status = 400
                ctx.body = { message: 'md5 验证失败!' }
                return
            }

            try {
                const ffprobeData = await ffprobeDataJson(vf.filePath)
                for (const item of ffprobeData.streams) {
                    if (item.codec_type === 'video') {
                        vf.status = 1
                        vf.videoDuration = parseNumber(item.duration, 0)
                        let fps = 0
                        const [f, s] = (item.r_frame_rate as string).split('/').map(Number)
                        if (f && s) {
                            fps = Math.floor(f / s)
                        }
                        vf.videoFps = fps
                        vf.videoBitrate = parseNumber(item.bit_rate, 0)
                        vf.videoWidth = parseNumber(item.width, 0)
                        vf.videoHeight = parseNumber(item.height, 0)
                    }
                }
                await vf.save()
            } catch (error) {
                vf.status = -2
                await vf.save()
                console.error(error)
                throw error
            }
        }
        ctx.body = {
            message: 'ok'
        }
    }
}

/**
 * 媒体文件管理
 */
export class VideoFileController {
    /**
     * 媒体文件列表
     */
    static async List (ctx: Router.RouterContext) {
        const query = ctx.request.query
        const page = parseNumber(query.page, 1)
        const limit = parseNumber(query.limit, 20)

        const where: WhereOptions = {}
        if (query.fileName) {
            where.fileName = { [Op.like]: '%' + query.fileName + '%' }
        }
        if (query.fileMd5) {
            where.fileMd5 = query.fileMd5
        }

        let order: Order = []
        if (query.order === '-id') {
            order = [['id', 'desc']]
        }

        const { rows, count } = await VideoFile.findAndCountAll({
            offset: page * limit - limit,
            limit,
            where,
            order
        })
        const host = `${ctx.request.protocol}://${ctx.request.host}`
        rows.forEach(vf => {
            vf.setDataValue('FilePath', host + '/' + vf.filePath)
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
        const { id, fileName } = ctx.request.body
        const mediaInfo = await VideoFile.findByPk(id)
        if (mediaInfo == null) {
            ctx.status = 400
            ctx.body = { message: 'ID不存在' }
            return
        }

        if (mediaInfo.fileName !== fileName) {
            // 修改文件名 不修改真实文件名
            // const filePath = mediaInfo.filePath.replace(mediaInfo.fileName,fileName)
            // renameSync(mediaInfo.filePath,filePath)
            // mediaInfo.filePath = filePath
            mediaInfo.fileName = fileName
        }
        mediaInfo.save()
        ctx.body = { message: '修改完成' }
    }

    /**
     * 删除媒体文件
     */
    static async Delete (ctx: Router.RouterContext) {
        const id = ctx.request.query.id
        const mediaInfo = await VideoFile.findByPk(Number(id))
        if (mediaInfo === null) {
            ctx.status = 400
            ctx.body = { message: '数据不存在' }
            return
        }

        const cacheKey = `upload:${mediaInfo.fileMd5}`
        await Redis.del(cacheKey)
        await mediaInfo.destroy()
        ctx.body = { message: mediaInfo.fileName + '删除成功' }
    }
}

/**
 * 转码参数管理
 */
export class VideoTranscodeController {
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

        const { rows, count } = await VideoTranscode.findAndCountAll({
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
            command
        } = ctx.request.body
        const vtinfo = await VideoTranscode.findByPk(id)
        if (vtinfo == null) {
            ctx.status = 400
            ctx.body = { message: 'ID不存在' }
            return
        }

        if (vtinfo.name !== name) {
            vtinfo.name = name
        }
        if (vtinfo.format !== format) {
            vtinfo.format = format
        }
        if (vtinfo.vcodec !== vcodec) {
            vtinfo.vcodec = vcodec
        }
        if (vtinfo.acodec !== acodec) {
            vtinfo.acodec = acodec
        }
        if (vtinfo.command !== command) {
            vtinfo.command = command
        }

        await vtinfo.save()
        ctx.body = { message: '修改完成' }
    }

    /**
     * 删除媒体文件
     */
    static async Delete (ctx: Router.RouterContext) {
        const id = ctx.request.query.id
        const vfInfo = await VideoTranscode.findByPk(Number(id))
        if (vfInfo === null) {
            ctx.status = 400
            ctx.body = { message: '数据不存在' }
            return
        }
        // 是否删除文件
        await vfInfo.destroy()
        ctx.status = 200
        ctx.body = { message: vfInfo.name + '删除成功' }
    }
}

/**
 * 提交转码任务管理
 */
export class VideoTaskController {
    /**
     * 新增转码任务
     */
    static async Add (ctx:Router.RouterContext) {
        const { fileId, transcodeId, command } = ctx.request.body
        const file = await VideoFile.findByPk(fileId)
        if (file == null || file.status < 1) {
            ctx.status = 400
            ctx.body = { message: '文件不存在,或状态错误' }
            return
        }
        const transcode = await VideoTranscode.findByPk(transcodeId)
        if (!transcode) {
            ctx.status = 400
            ctx.body = { message: '编码器不存在' }
            return
        }
        // // 验证是否已存在数据
        // const taskExist = await VideoTask.findOne({
        //   where: {
        //     videoFileId: fileId,
        //     videoTranscodeId: transcodeId
        //   }
        // })
        // if (taskExist) {
        //   ctx.status = 400
        //   ctx.body = { message: '已存在相同的文件与编码器' }
        //   return
        // }

        // 处理其他更多的参数。
        const options:string[] = [`-vcodec ${transcode.vcodec}`, `-acodec ${transcode.acodec}`]
        // 编码器参数配置+覆盖。
        const mergeOptions = (transcode.command ?? '') + '\n' + (command ?? '')
        for (const item of mergeOptions.split('\n')) {
            const option = item.trim()
            if (option) options.push(option)
        }

        // 新增转码数据
        const task = await VideoTask.create({
            videoFileId: fileId,
            videoTranscodeId: transcodeId,
            options: JSON.stringify(options, null, 2),
            status: 0
        })
        task.outFile = join(dirname(file.filePath), `${task.id}/index.${transcode.format}`)
        await task.save()
        if (!transcodeChannel.send(task.id)) {
            ctx.status = 400
            ctx.body = { message: '提交队列失败' }
            return
        }
        await transcodeChannel.log(task.id, `${Date} - 添加任务到queue`)
        ctx.body = {
            message: '提交完成'
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

        const { rows, count } = await VideoTask.findAndCountAll({
            offset: page * limit - limit,
            limit,
            where,
            order,
            include: [
                { model: VideoFile },
                { model: VideoTranscode }
            ]
        })
        const host = `${ctx.request.protocol}://${ctx.request.host}`
        rows.forEach(vt => {
            vt.setDataValue('OutFile', host + '/' + vt.outFile)
        })

        ctx.body = {
            data: rows,
            total: count
        }
    }

    // 查询任务进度
    static async Progress (ctx:Router.RouterContext) {
        const task = await VideoTask.findByPk(parseNumber(ctx.query.id, 0))
        if (task == null) {
            ctx.status = 400
            ctx.body = { message: '任务不存在' }
            return
        }
        const progress = await Redis.get(`transcode:progress:${ctx.query.id}`)
        ctx.body = { progress }
    }
}

/**
 * dashboard 仪表盘数据
 */
export const vodDashBoard = async (ctx:Router.RouterContext) => {
    // 原始文件大小统计
    const fileSize = await VideoFile.sum('fileSize')
    const fileTotal = await VideoFile.count()
    const transcodeTotal = await VideoTranscode.count()
    const taskTotal = await VideoTask.count()
    ctx.body = {
        fileSize,
        fileTotal,
        taskTotal,
        transcodeTotal
    }
}
