import { access, mkdirSync, constants } from "fs";
import { parse } from "path";
import SparkMD5 from "spark-md5"
// const sparkmd5 = new SparkMD5()

export const md5 = (d: string) => {
    return SparkMD5.hash(d)
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