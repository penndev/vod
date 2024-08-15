import amqp from 'amqplib'
import conn from '../config/amqp.js'
import Redis from '../config/redis.js'
import { parseNumber } from '../util/index.js'

interface TranscodeChannel extends amqp.Channel {
    /**
     * 发送转码任务到队列
     * @param vtID VideoTask 表的 ID
     * @param options
     */
    send(vtID: number, options?: amqp.Options.Publish): boolean
    /**
     * 执行任务回调函数
     * @param onMessage
     * @param options
     */
    recv(onMessage: (vtID: number) => Promise<boolean>, options?: amqp.Options.Consume): Promise<amqp.Replies.Consume>
    /**
     * 写入操作日志到Redis
     * @param vtID VideoTask 表的 ID
     * @param content
     */
    log(vtID: number, content: string):Promise<void>
    /**
     * 设置转码任务的进度
     * @param vtID VideoTask 表的 ID
     * @param content
     */
    progress(vtID: number, n: number):Promise<void>
}

const transcodeChannel = (await conn.createChannel()) as TranscodeChannel
await transcodeChannel.assertQueue('transcode', { durable: true })

/**
 * 创建一个transcode 模型
 */
{
    transcodeChannel.send = (vtID: number, options?: amqp.Options.Publish) => {
        return transcodeChannel.sendToQueue('transcode', Buffer.from(`${vtID}`), options)
    }
    transcodeChannel.recv = (onMessage, options) => {
        return transcodeChannel.consume('transcode', async (msg) => {
            if (msg == null) return
            try {
                const vtID = parseNumber(msg.content.toString(), 0)
                const result = await onMessage(vtID)
                console.log(`${vtID} -> ${result}`)
            } catch (error) {
                console.log(error)
            }
            transcodeChannel.ack(msg)
        }, options)
    }
    transcodeChannel.log = async (vtID: number, content: string) => {
        await Redis.rPush(`transcode:log:${vtID}`, `${new Date()}:${content}`)
        await Redis.expire(`transcode:log:${vtID}`, 2 * 86400)
    }
    transcodeChannel.progress = async (vtID: number, n: number) => {
        await Redis.set(`transcode:progress:${vtID}`, n, { EX: 86400 })
    }
}
// -

export default transcodeChannel
