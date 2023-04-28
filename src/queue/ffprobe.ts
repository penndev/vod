import ffmpeg from 'fluent-ffmpeg'
import Queue from 'bull'
import config from '../config/index.js'
import { VideoFile } from '../orm/index.js'
import { md5laragefile } from '../util/index.js'

const ffprobeQueue = new Queue('ffprobe analyze', config.redisParse, { prefix: `bull:${config.node}` })

// 上传完毕后分析媒体文件内容
// @param jobData  VideoFile 实例json
const callBack:Queue.ProcessCallbackFunction<VideoFile> = async (job, done) => {
  const jobData = job.data as VideoFile
  const md5 = await md5laragefile(jobData.filePath)
  if (jobData.fileMd5 !== md5) {
    VideoFile.update({ status: -1 }, { where: { id: jobData.id } })
    done()
    return
  }
  const analyze = ffmpeg(jobData.filePath)
  analyze.ffprobe(async (err, data) => {
    if (err != null) {
      job.log(err)
    }
    if (typeof data.streams !== 'object') {
      VideoFile.update({ status: -2 }, { where: { id: jobData.id } })
      done()
      return
    }
    const streams = data.streams
    for (const item of streams) {
      if (item.codec_type === 'video') {
        await VideoFile.update({
          status: 1,
          videoDuration: Number(item.duration),
          videoFps: Number(item.level),
          videoBitrate: Number(item.bit_rate),
          videoWidth: Number(item.width),
          videoHeight: Number(item.height)
        }, {
          where: {
            id: jobData.id
          }
        })
      }
    }
    done()
  })
}

if (['queue', 'dev'].includes(process.env.ENV_NODE as string)) {
  console.log('bull (ffprobeQueue) started')
  ffprobeQueue.process(callBack)
}

export default ffprobeQueue
