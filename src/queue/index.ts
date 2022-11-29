import { KoaAdapter } from '@bull-board/koa'
import { BullAdapter } from '@bull-board/api/bullAdapter.js';
import { createBullBoard } from '@bull-board/api';
import ffmpegQueue from "./ffmpeg.js";
import ffprobeQueue from './ffprobe.js'
import mpegtsQueue from './mpegts.js';


const serverAdapter = new KoaAdapter();
// 队列添加到仪表盘
createBullBoard({
    queues: [
        new BullAdapter(ffmpegQueue),
        new BullAdapter(ffprobeQueue),
        new BullAdapter(mpegtsQueue),
    ],
    serverAdapter
})
// 设置仪表盘的目录
serverAdapter.setBasePath('/bull');


export {
    serverAdapter,
    ffmpegQueue,
    ffprobeQueue,
    mpegtsQueue,
}