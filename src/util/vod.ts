import ffmpeg from 'fluent-ffmpeg'

export const ffprobeDataJson = (fp:string):Promise<ffmpeg.FfprobeData> => {
    return new Promise((resolve, reject) => {
        const analyze = ffmpeg(fp)
        analyze.ffprobe(async (err, data) => {
            if (err != null) {
                reject(new Error(err))
            } else {
                resolve(data)
            }
        })
    })
}
