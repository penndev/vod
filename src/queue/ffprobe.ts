import ffmpeg from 'fluent-ffmpeg'
import Queue from 'bull'
import config from '../config/index.js'
import { Media } from '../orm/index.js'
import { md5laragefile } from '../util/index.js'

const ffprobeQueue = new Queue('ffprobe analyze', config.rdsuri)

// @param jobData  Media 实例json
const callBack:Queue.ProcessCallbackFunction<Media> = async (job, done) => {
    const jobData = job.data as Media
    const md5 = await md5laragefile(jobData.filePath)
    if (jobData.fileMd5 != md5) {
        Media.update({ status: -1, }, { where: { id: jobData.id } })
        done()
    }
    const analyze = ffmpeg(jobData.filePath)
    analyze.ffprobe(function (err, data) {
        if (err != null){
            job.log(err)
        }
        if (typeof data.streams != 'object') {
            Media.update({ status: -2, }, { where: { id: jobData.id } })
            done()
        }
        const streams = data.streams
        for (const item of streams) {
            if (item.codec_type == 'video') {
                Media.update({
                    status: 1,
                    videoDuration: item.duration,
                    videoFps: item.level,
                    videoBitrate: item.bit_rate,
                    videoWidth: item.width,
                    videoHeight: item.height,
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

if ( ["queue","dev"].includes(process.env.NODE_ENV as string)){
    console.log('bull (ffprobeQueue) started')
    ffprobeQueue.process(callBack)
}

export default ffprobeQueue