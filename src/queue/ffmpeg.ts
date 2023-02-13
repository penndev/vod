import ffmpeg from 'fluent-ffmpeg'
import Queue from 'bull'
import config from '../config/index.js'
import { ismkdir } from '../util/index.js'
import { ffmpegInput } from './interface.js'
import { VideoTask } from '../orm/model.js'

const ffmpegQueue = new Queue('ffmpeg transcodes', config.rdsuri, {prefix:`bull:${config.node}`})


const callBack:Queue.ProcessCallbackFunction<ffmpegInput> = async(job,done)=>{
    const jobData =  job.data as ffmpegInput
    await ismkdir(jobData.outPutFile)
    const transcoding = ffmpeg(job.data.inputFile)
    transcoding.on('error', (err, stdout, stderr) => {
        job.log(stderr)
        VideoTask.update({ status: -1 }, { where: { id: jobData.taskId } })
        done()
        return
    })
    transcoding.on('end', async () => { 
        VideoTask.update({ status: 1 }, { where: { id: jobData.taskId } })
        job.log("转码完成")
        done()
        return 
    })
    transcoding.on('progress', async (progress) => {
        job.progress(progress.percent)
    })
    transcoding.save(jobData.outPutFile)
    // const keyfile = jobData.hlsPath.replace("index.m3u8", "index.key")
    // const transcoding = ffmpeg(job.data.filePath)
    // transcoding.outputOptions([
    //     "-hls_list_size 0",//展示所有的m3u8
    //     "-hls_time 15",//分段时长
    //     "-hls_enc 1",
    //     `-hls_enc_key ${jobData.hlsKey}`,
    //     `-hls_enc_key_url ${keyfile}`
    // ])

    // transcoding.on('start', (commandLine) => {
    //     job.log('开始转码：转码命令' + commandLine)
    // })
    // transcoding.on('error', (err, stdout, stderr) => {
    //     job.log(stderr)
    //     Media.update({ status: -2 }, { where: { id: jobData.id } })
    //     done()
    //     return
    // })
    // transcoding.on('progress', async (progress) => {
    //     job.progress(progress.percent)
    // })
    // transcoding.on('end', async () => {
    //     const hlscontent = readFileSync(jobData.hlsPath, { encoding: 'utf-8' })
    //     const newHlsContent = hlscontent.replace(keyfile, "index.key")
    //     writeFileSync(jobData.hlsPath, newHlsContent)
    //     Media.update({ status: 2 }, { where: { id: jobData.id } })
    //     job.log("转码完成")
    //     done()
    //     return 
    // })
    // transcoding.save(jobData.hlsPath)
}

if ( ["queue","dev"].includes(process.env.NODE_ENV as string)){
    console.log('bull (ffmpegQueue) started')
    ffmpegQueue.process(callBack)
}

export default ffmpegQueue