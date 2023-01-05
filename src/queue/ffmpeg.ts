import ffmpeg from 'fluent-ffmpeg'
import Queue from 'bull'
import { readFileSync, writeFileSync } from 'fs'
import config from '../config/index.js'
import { ismkdir } from '../util/index.js'
import { Media } from '../orm/index.js'

const ffmpegQueue = new Queue('ffmpeg transcodes', config.rdsuri)

// @param job.data  Media 序列化json数据
const callBack:Queue.ProcessCallbackFunction<Media> = async(job,done)=>{
    const jobData =  job.data as Media
    await ismkdir(jobData.hlsPath)
    const keyfile = jobData.hlsPath.replace("index.m3u8", "index.key")

    const transcoding = ffmpeg(job.data.filePath)
    transcoding.outputOptions([
        "-hls_list_size 0",//展示所有的m3u8
        "-hls_time 15",//分段时长
        "-hls_enc 1",
        `-hls_enc_key ${jobData.hlsKey}`,
        `-hls_enc_key_url ${keyfile}`
    ])
    transcoding.on('start', (commandLine) => {
        job.log('开始转码：转码命令' + commandLine)
    })
    transcoding.on('error', (err, stdout, stderr) => {
        job.log(stderr)
        Media.update({ status: -2 }, { where: { id: jobData.id } })
        done()
    })
    transcoding.on('progress', async (progress) => {
        job.progress(progress.percent)
    })
    transcoding.on('end', async () => {
        const hlscontent = readFileSync(jobData.hlsPath, { encoding: 'utf-8' })
        const newHlsContent = hlscontent.replace(keyfile, "index.key")
        writeFileSync(jobData.hlsPath, newHlsContent)
        Media.update({ status: 2 }, { where: { id: jobData.id } })
        job.log("转码完成")
        done()  
    })
    transcoding.save(jobData.hlsPath)
}

if ( ["queue","dev"].includes(process.env.NODE_ENV as string)){
    console.log('bull (ffmpegQueue) started')
    ffmpegQueue.process(callBack)
}

export default ffmpegQueue