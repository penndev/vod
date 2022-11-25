import ffmpeg from 'fluent-ffmpeg'
import Queue from 'bull'
import config from '#config/index.js'
import { ismkdir } from '../util/index.js'
import { writeFileSync } from 'fs'
import { Media } from '../orm/model.js'

const ffmpegQueue = new Queue('ffmpeg transcodes', config.rdsuri)


// input job.data param
// {
//     "input":"filefullpath",
//     "output":"filefullpath",
//     "key":"123456789"
// }
ffmpegQueue.process(async (job, done) => {

    // 创建文件夹
    await ismkdir(job.data.output)
    const transcoding = ffmpeg(job.data.input)
    transcoding.outputOptions([
        "-hls_list_size 0",//展示所有的m3u8
        "-hls_time 15",//分段时长
        "-hls_enc 1",
        `-hls_enc_key ${job.data.key}`,
        "-hls_enc_key_url index.key"
    ])
    transcoding.on('start', (commandLine) => {
        job.log('开始转码：转码命令' + commandLine)
    })
    transcoding.on('error', (err, stdout, stderr) => {
        job.log(stderr)
        Media.update({ status: -2 }, { where: { hlspath: job.data.output } })
        done()
    })
    transcoding.on('progress', async (progress) => {
        job.progress(progress.percent)
    })
    transcoding.on('end', (stdout, stderr) => {
        const keyfile = (job.data.output as string).replace("index.m3u8","index.key") 
        writeFileSync(keyfile,job.data.key)
        Media.update({ status: 2 }, { where: { hlspath: job.data.output } })
        job.log("转码完成")
        done()
    })
    transcoding.save(job.data.output)
})

export default ffmpegQueue