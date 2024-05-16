import { existsSync, mkdirSync, createReadStream, unlinkSync, readdirSync, statSync } from 'fs'
import path, { parse } from 'path'
import crypto from 'crypto'
import os from 'node:os'

// ============================== 文件

/**
 * 统计文件夹路径
 * @param folderPath 文件夹路径
 * @returns 统计文件字节
 */
export const getFolderSize = (folderPath:string) :number => {
    let totalSize = 0
    try {
        const files = readdirSync(folderPath)
        files.forEach(file => {
            const filePath = path.join(folderPath, file)
            const stats = statSync(filePath)
            if (stats.isFile()) {
                totalSize += stats.size
            }
        })
    } catch (error) {
        totalSize = 1
    }
    return totalSize
}

/**
 * 计算大文件的md5
 * @param p 文件路径
 * @returns 32位的md5 hex
 */
export const md5LargeFile = (p :string) => {
    return new Promise<string>((resolve, reject) => {
        const md5sum = crypto.createHash('md5')
        const fileStream = createReadStream(p)
        fileStream.on('data', (dataChunk) => {
            md5sum.update(dataChunk)
        })
        fileStream.on('end', () => {
            resolve(md5sum.digest('hex'))
        })
        fileStream.on('error', (err) => {
            reject(err)
        })
    })
}

/**
 * 安全递归的创建文件夹
 * @param filepath
 * @returns
 */
export const isMkdir = async (filepath: string) => {
    const dir = parse(filepath).dir
    if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true })
    }
}

/**
 * 安全删除文件
 * @param filepath
 * @returns true 执行了删除操作。false 文件不存在
 */
export const isUnlink = (filepath: string) => {
    return new Promise<boolean>((resolve, reject) => {
        try {
            if (existsSync(filepath)) {
                unlinkSync(filepath)
                resolve(true)
            } else{
                resolve(false)
            }
        } catch (error) {
            reject(error)
        }
    })
}

// ============================== 算法

/**
 * 计算字符串的md5
 * @param s 字符串
 * @returns 32hex
 */
export const md5 = (s: string) => {
    return crypto.createHash('md5').update(s, 'utf8').digest('hex')
}

/**
 * 生成随机字符串
 * @param length
 * @returns
 */
export const randomStr = (length: number) => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length))
    }
    return result
}

// ============================== 拓展

/**
 * 模拟其他语言的 sleep 函数
 * @param ms 毫秒
 * @returns promise
 */
export const sleep = (ms: number) => {
    return new Promise<void>((resolve) => {
        setTimeout(resolve, ms)
    })
}

/**
 * 语法糖，模拟格式化number数据
 * @param value
 * @param defaultValue
 * @returns
 */
export const parseNumber = (value: unknown, defaultValue: number) => {
    const num = parseInt(value as string)
    if (isNaN(num)) {
        return defaultValue
    }
    return num
}

/**
 * 返回本机host
 * @param host 某个host
 * @returns
 */
export const networks = (host: string) => {
    const netInterface = Object.values(os.networkInterfaces())
    const netFlatMap = netInterface.flatMap((nInterface) => nInterface ?? [])
    return netFlatMap.filter((detail) => detail && (detail.address === host || host === '0.0.0.0') && detail.family === 'IPv4')
}
