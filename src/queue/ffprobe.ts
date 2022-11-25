import ffmpeg from 'fluent-ffmpeg'
import Queue from 'bull'
import config from '#config/index.js'
import { Media } from '../orm/model.js'
import { type } from 'os'

const ffprobeQueue = new Queue('ffprobe analyze', config.rdsuri)


ffprobeQueue.process(async (job, done) => {
    // 计算文件md5
    // const md5 = await md5laragefile(job.data.filepath)
    // if ( job.data.filemd5 != md5 ){
    //     Media.update({ status: -1, }, { where: { id: job.data.id } })
    //     done()
    // }
    const analyze = ffmpeg(job.data.filepath)
    analyze.ffprobe(function (err, data) {
        console.log("========================================>",err,data)
        
        if (typeof data != 'object') {
            // 视频分析失败
            Media.update({ status: -2, }, { where: { id: job.data.id } })
            done()
        }
        const streams = data.streams
        for (let item of streams) {
            if (item.codec_type == 'video') {
                Media.update({
                    status:1,
                    videoduration: Number(item.duration) * 1000,
                    videofps: item.level,
                    videobitrate: item.bit_rate,
                    videowidth: item.width,
                    videoheight: item.height,
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

export default ffprobeQueue
