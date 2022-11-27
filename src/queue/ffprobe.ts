import ffmpeg from 'fluent-ffmpeg'
import Queue from 'bull'
import config from '#config/index.js'
import { Media } from '#orm/model.js'
import { md5laragefile } from '#util/index.js'

const ffprobeQueue = new Queue('ffprobe analyze', config.rdsuri)

if (process.env.NODE_ENV == "queue") {
    ffprobeQueue.process(async (job, done) => {
        // 计算文件md5
        const md5 = await md5laragefile(job.data.filePath)
        if (job.data.fileMd5 != md5) {
            Media.update({ status: -1, }, { where: { id: job.data.id } })
            done()
        }
        const analyze = ffmpeg(job.data.filePath)
        analyze.ffprobe(function (err, data) {
            console.log("============>", err, data)
            if (typeof data.streams != 'object') {
                // 视频分析失败
                Media.update({ status: -2, }, { where: { id: job.data.id } })
                done()
            }
            const streams = data.streams
            for (let item of streams) {
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
                            id: job.data.id
                        }
                    })
                }
            }
            done()
        })
    })
}

export default ffprobeQueue
