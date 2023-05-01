import { exit } from 'process'
import { VideoFile } from '../src/orm/index.js'
import { parseNumber } from '../src/util/index.js'
import { ffprobeDataJson } from '../src/util/vod.js'

const vf = await VideoFile.findByPk(2)
if (vf === null) {
  exit(1)
}

vf.status = -2
const ffprobeData = await ffprobeDataJson(vf.filePath)
for (const item of ffprobeData.streams) {
  if (item.codec_type === 'video') {
    vf.status = 1
    vf.videoDuration = parseNumber(item.duration, 0)
    let fps = 0
    const [f, s] = (item.r_frame_rate as string).split('/').map(Number)
    if (f && s) {
      fps = Math.floor(f / s)
    }
    vf.videoBitrate = fps
    vf.videoWidth = parseNumber(item.width, 0)
    vf.videoHeight = parseNumber(item.height, 0)
  }
}

await vf.save()
