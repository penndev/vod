import ffmpeg from 'fluent-ffmpeg'
import Queue from 'bull'
import config from '../config/index.js'
import { VideoTask } from '../orm/model.js'
import { parse, resolve } from 'path'

export interface ffmpegInput {
    inputFile: string
    outPutFile: string
    options: string[]
    taskId: number
}

const ffmpegQueue = new Queue('ffmpeg transcodes', config.redisParse, { prefix: `bull:${config.node}` })

const callBack:Queue.ProcessCallbackFunction<ffmpegInput> = async (job, done) => {
  const jobData = job.data as ffmpegInput
  const inputFile = resolve(job.data.inputFile)
  const outPutFileParse = parse(resolve(jobData.outPutFile))
  const transcoding = ffmpeg({ cwd: outPutFileParse.dir })
  transcoding.input(inputFile)
  transcoding.outputOptions(jobData.options)
  transcoding.output(outPutFileParse.base)
  transcoding.on('error', (_err, _stdout, stderr) => {
    job.log(stderr)
    VideoTask.update({ status: -1 }, { where: { id: jobData.taskId } })
    done()
  })
  transcoding.on('end', async () => {
    VideoTask.update({ status: 1 }, { where: { id: jobData.taskId } })
    job.log('转码完成')
    done()
  })
  transcoding.on('progress', async (progress) => {
    job.progress(progress.percent)
  })
  transcoding.on('start', (commandLine) => {
    job.log('开始转码：转码命令' + commandLine)
  })
  transcoding.run()
}

if (['queue', 'dev'].includes(process.env.ENV_NODE as string)) {
  console.log('bull (ffmpegQueue) started')
  ffmpegQueue.process(callBack)
}

export default ffmpegQueue
