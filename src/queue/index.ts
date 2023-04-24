import { KoaAdapter } from '@bull-board/koa'
import { BullAdapter } from '@bull-board/api/bullAdapter.js'
import { createBullBoard } from '@bull-board/api'
import ffmpegQueue, { ffmpegInput } from "./ffmpeg.js"
import ffprobeQueue from './ffprobe.js'

const serverAdapter = new KoaAdapter();

// 队列添加到仪表盘
createBullBoard({
    queues: [
        new BullAdapter(ffmpegQueue),
        new BullAdapter(ffprobeQueue),
    ],
    serverAdapter
})

export {
    serverAdapter,
    ffmpegQueue,
    ffprobeQueue,
    
    ffmpegInput,
}