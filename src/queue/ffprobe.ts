import ffmpeg from 'fluent-ffmpeg'
import Queue from 'bull'
import config from '../config/index.js'
import { Media } from '../orm/index.js'
import { md5laragefile } from '../util/index.js'

const ffprobeQueue = new Queue('ffprobe analyze', config.rdsuri)

// 上传完毕后分析媒体文件内容
// @param jobData  Media 实例json
const callBack:Queue.ProcessCallbackFunction<Media> = async (job, done) => {
    const jobData = job.data as Media
    const md5 = await md5laragefile(jobData.filePath)
    if (jobData.fileMd5 != md5) {
        Media.update({ status: -1, }, { where: { id: jobData.id } })
        done()
        return
    }
    const analyze = ffmpeg(jobData.filePath)
    analyze.ffprobe(function (err, data) {
        if (err != null){
            job.log(err)
        }
        if (typeof data.streams != 'object') {
            Media.update({ status: -2, }, { where: { id: jobData.id } })
            done()
            return
        }
        const streams = data.streams
        for (const item of streams) {
            if (item.codec_type == 'video') {
                Media.update({
                    status: 1,
                    videoDuration: Number(item.duration),
                    videoFps: Number(item.level),
                    videoBitrate: Number(item.bit_rate),
                    videoWidth: Number(item.width),
                    videoHeight: Number(item.height),
                }, {
                    where: {
                        id: jobData.id
                    }
                })
            }
        }
        done()
        return
    })
}

if ( ["queue","dev"].includes(process.env.NODE_ENV as string)){
    console.log('bull (ffprobeQueue) started')
    ffprobeQueue.process(callBack)
}

export default ffprobeQueue