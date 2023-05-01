import ffmpeg from 'fluent-ffmpeg'
import Queue from 'bull'
import config from '../config/index.js'
import { VideoTask } from '../orm/model.js'
import { parse, resolve } from 'path'

interface transcodeTaskData {
    inputFile: string
    outPutFile: string
    options: string[]
    taskId: number
}

const transcodeTask = new Queue('FFmpeg Task', config.redisParse)

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
    VideoTask.update({ status: 1 }, { where: { id: jobData.taskId } })
    done()
  })
  transcoding.on('error', (err, stdout, stderr) => {
    VideoTask.update({ status: -1 }, { where: { id: jobData.taskId } })
    done(new Error(`err:[${err}] \n  stdout:[${stdout}] \n stderr:[${stderr}]`))
  })
  transcoding.run()
}

transcodeTask.process(callBack)

export {
  transcodeTask,
  transcodeTaskData
}
