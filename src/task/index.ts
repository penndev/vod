import { KoaAdapter } from '@bull-board/koa'
import { BullAdapter } from '@bull-board/api/bullAdapter.js'
import { createBullBoard } from '@bull-board/api'
import { transcodeTask, transcodeTaskData } from './transcode.js'

const serverAdapter = new KoaAdapter()

// 队列添加到仪表盘
createBullBoard({
  queues: [
    new BullAdapter(transcodeTask)
  ],
  serverAdapter
})

export {
  serverAdapter,
  transcodeTask,

  transcodeTaskData
}
