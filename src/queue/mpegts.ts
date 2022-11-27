import Queue from 'bull'
import config from '#config/index.js'
import { Media } from '#orm/model.js'
import { createReadStream } from 'fs'
import { createInterface } from 'readline'

const MpegtsQueue = new Queue('Mpegts analyze', config.rdsuri)

// job.data 
// @param id (media id)
MpegtsQueue.process(async(job,done)=>{
    const mediaInfo = await Media.findByPk(job.data.id)
    if( mediaInfo === null){
        return done()
    }
    const hlsContent = createReadStream(mediaInfo.hlsPath)
    const allline = createInterface({input:hlsContent})
    // 行读文件
    for await(const line of allline){
        console.log(line)
    }
    done()
})

MpegtsQueue.add({id:17})