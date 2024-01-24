import ffmpeg from 'fluent-ffmpeg'
import Queue from 'bull'
import config from '../config/index.js'
import { VideoTask } from '../orm/index.js'
import { parse, resolve } from 'path'
import { getFolderSize } from '../util/index.js'

interface transcodeTaskData {
    inputFile: string
    outPutFile: string
    options: string[]
    taskId: number
}

const callBack:Queue.ProcessCallbackFunction<transcodeTaskData> = async (job, done) => {
    const jobData = job.data as transcodeTaskData
    const inputFile = resolve(job.data.inputFile)
    const outPutFileParse = parse(resolve(jobData.outPutFile))
    const transcoding = ffmpeg({ cwd: outPutFileParse.dir })
    transcoding.input(inputFile)
    transcoding.outputOptions(jobData.options)
    transcoding.output(outPutFileParse.base)

    transcoding.on('progress', async (progress) => {
        job.progress(progress.percent)
    })
    transcoding.on('start', (commandLine) => {
        job.log('开始转码：转码命令' + commandLine)
    })
    transcoding.on('end', async () => {
        const outSize = getFolderSize(outPutFileParse.dir) // 获取文件夹大小
        VideoTask.update({ status: 1, outSize }, { where: { id: jobData.taskId } })
        done()
    })
    transcoding.on('error', (err, stdout, stderr) => {
        VideoTask.update({ status: -1 }, { where: { id: jobData.taskId } })
        done(new Error(`err:[${err}] \n  stdout:[${stdout}] \n stderr:[${stderr}]`))
    })
    transcoding.run()
}

const transcodeTask: Queue.Queue<transcodeTaskData> = new Queue('FFmpeg Task', config.redisParse)

/**
 * 队列执行函数进行挂载
 * 如果挂载后任务将在当前线程后台执行。如果报错可能导致当前线程崩溃
 * 请在专门的队列工作线程进行挂载
 */
transcodeTask.process(callBack)

export {
    transcodeTask
}
