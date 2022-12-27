import { access, mkdirSync, constants, createReadStream } from 'fs'
import { parse } from 'path'
import crypto from 'crypto'
import os$3 from 'node:os'

export const md5 = (d: string) => {
    return crypto.createHash('md5').update(d, 'utf8').digest('hex') 
}

export const md5laragefile = (p :string) => {
    return new Promise<string>((resolve, reject) => {
        const md5sum = crypto.createHash('md5')
        const filestream = createReadStream(p)
        filestream.on('data',(dataChunk)=>{
            md5sum.update(dataChunk)
        })
        filestream.on('end', () => {
            resolve(md5sum.digest('hex'))
        })
    })
}

export const sleep = (ms: number) => {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

export const ismkdir = (filepath: string) => {
    const dir = parse(filepath).dir;
    return new Promise((resolve, reject) => {
        access(dir, constants.F_OK, (err) => {
            resolve(mkdirSync(dir,{recursive: true}))
        });
    })
}

export const randomstr = (length: number) => {
    const characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result           = '';
    for ( var i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

export const networks = (host: string) => {
    const netInterface = Object.values(os$3.networkInterfaces())
    const netFlatMap = netInterface.flatMap((nInterface) => nInterface ?? [])
    const netWorks = netFlatMap.filter((detail) => detail && detail.address && detail.family == 'IPv4')
    return networks
    // for(let item of netWorks){
    // console.log('\x1b[36m open in browser http://%s:%s \x1b[0m', item.address, config.port)
    // }
}