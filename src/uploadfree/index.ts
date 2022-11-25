import { upload } from "./haokan.js"
import { readFileSync } from 'fs'

// 上传文件 uploadfree("1.png").then(resp => { console.log(resp) }).catch(err => { console.log(err) })
export const uploadfree = async(fspath:string):Promise<string> => {
    const upfile = readFileSync(fspath)
    const url = await upload(upfile)
    return url
}
