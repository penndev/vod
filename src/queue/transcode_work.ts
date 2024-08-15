import ffmpeg from 'fluent-ffmpeg'
import transcodeChannel from './transcode.js'

import { parse, resolve } from 'path'
import { getFolderSize, isMkdir } from '../util/index.js'
import { VideoFile, VideoTask } from '../orm/index.js'

const callBackMessage = async (vtID: number) : Promise<boolean> => {
    // VideoTask处理。
    const vt = await VideoTask.findByPk(vtID)
    if (vt === null) throw new Error(`VideoTask is null [${vtID}]`)
    // if (vt.status !== 0) throw new Error(`VideoTask status [${vt.status}]`)
    vt.status = 1
    await vt.save()
    const vf = await VideoFile.findByPk(vt.videoFileId)
    if (vf === null) {
        throw new Error(`VideoFile is null [${vt.videoFileId}]`)
    }
    // - 处理入参准备
    const inputFile = resolve(vf.filePath)
    const putParse = parse(resolve(vt.outFile))
    await isMkdir(vt.outFile)
    // -
    return new Promise<boolean>((_resolve, _reject) => {
        const transcoding = ffmpeg({ cwd: putParse.dir })
        transcoding.input(inputFile)
        transcoding.outputOptions(JSON.parse(vt.options))
        transcoding.output(putParse.base)
        transcoding.on('progress', (progress) => {
            transcodeChannel.progress(vt.id, progress.percent).catch(console.error)
        })
        transcoding.on('start', (commandLine) => {
            transcodeChannel.log(vt.id, `开始转码:[${commandLine}]`).catch(console.error)
        })
        transcoding.on('end', async () => {
            try {
                const outSize = getFolderSize(putParse.dir) // 获取文件夹大小
                VideoTask.update({ status: 2, outSize }, { where: { id: vtID } })
            } catch (error) {
                console.error(error)
            }
            _resolve(true)
        })
        transcoding.on('error', async (err, stdout, stderr) => {
            try {
                transcodeChannel.log(vt.id, `err:[${err}] \n  stdout:[${stdout}] \n stderr:[${stderr}]`)
                VideoTask.update({ status: -1 }, { where: { id: vtID } })
            } catch (error) {
                console.error(error)
            }
            _reject(new Error('transcode fail'))
        })
        transcoding.run()
    })
}

/**
 * 处理线程
 */
transcodeChannel.prefetch(1)

/**
 * 插载执行函数
 */
transcodeChannel.recv(callBackMessage)
