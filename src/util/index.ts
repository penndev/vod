import { existsSync, mkdirSync, createReadStream, unlinkSync } from 'fs'
import { parse } from 'path'
import crypto from 'crypto'
import os from 'node:os'

export const md5 = (d: string) => {
  return crypto.createHash('md5').update(d, 'utf8').digest('hex')
}

export const md5laragefile = (p :string) => {
  return new Promise<string>((resolve, reject) => {
    const md5sum = crypto.createHash('md5')
    const filestream = createReadStream(p)
    filestream.on('data', (dataChunk) => {
      md5sum.update(dataChunk)
    })
    filestream.on('end', () => {
      resolve(md5sum.digest('hex'))
    })
    filestream.on('error', (err) => {
      reject(err)
    })
  })
}

/**
 * 模拟其他语言的 sleep 函数
 * @param ms 毫秒
 * @returns promise
 */
export const sleep = (ms: number) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

/**
 * 安全递归的创建文件夹
 * @param filepath
 * @returns
 */
export const ismkdir = (filepath: string) => {
  const dir = parse(filepath).dir
  return new Promise((resolve, reject) => {
    try {
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true })
      }
      resolve(true)
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * 安全删除文件
 * @param filepath
 * @returns
 */
export const isunlink = (filepath: string) => {
  return new Promise((resolve, reject) => {
    try {
      if (existsSync(filepath)) {
        unlinkSync(filepath)
      }
      resolve(true)
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * 生成随机字符串
 * @param length
 * @returns
 */
export const randomstr = (length: number) => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length))
  }
  return result
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
