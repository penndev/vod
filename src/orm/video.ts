import { DataTypes, Model, InitOptions } from 'sequelize'

class VideoFile extends Model {
    declare id: number
    declare createdAt: Date
    declare updatedAt: Date

    declare status: number

    declare fileName: string
    declare filePath: string
    declare fileMd5: string
    declare fileSize: number

    declare videoDuration: number
    declare videoFps: number
    declare videoBitrate: number
    declare videoWidth: number
    declare videoHeight: number

    public static initial (options: InitOptions) {
        this.init(
            {
                status: {
                    type: DataTypes.TINYINT,
                    defaultValue: 0,
                    comment: '-2:视频ffprobe分析错误|-1:md5错误|0:上传中|1:媒体分析正常'
                },
                fileName: {
                    type: DataTypes.STRING,
                    allowNull: false
                },
                filePath: {
                    type: DataTypes.STRING,
                    allowNull: true
                },
                fileMd5: {
                    type: DataTypes.CHAR(32),
                    allowNull: true
                },
                fileSize: {
                    type: DataTypes.INTEGER.UNSIGNED,
                    defaultValue: 0
                },
                videoDuration: {
                    type: DataTypes.INTEGER.UNSIGNED,
                    defaultValue: 0,
                    comment: '视频时长'
                },
                videoFps: {
                    type: DataTypes.TINYINT.UNSIGNED,
                    defaultValue: 0,
                    comment: '视频帧率'
                },
                videoBitrate: {
                    type: DataTypes.MEDIUMINT.UNSIGNED,
                    defaultValue: 0,
                    comment: '视频比特率'
                },
                videoWidth: {
                    type: DataTypes.SMALLINT.UNSIGNED,
                    defaultValue: 0,
                    comment: '视频宽度'
                },
                videoHeight: {
                    type: DataTypes.SMALLINT.UNSIGNED,
                    defaultValue: 0,
                    comment: '视频高度'
                },
                hlsPath: {
                    type: DataTypes.STRING,
                    allowNull: true,
                    comment: 'm3u8 path'
                },
                hlsKey: {
                    type: DataTypes.CHAR(16),
                    allowNull: true,
                    comment: 'hls aes key'
                }
            },
            options
        )
    }
}

class VideoTranscode extends Model {
    declare id: number
    declare createdAt: Date
    declare updatedAt: Date

    declare name:string
    declare format:string

    declare vcodec:string
    declare vwidth: number
    declare vheight: number
    declare vcrf: number
    declare vfps: number
    declare vbitrate: number

    declare acodec:string
    declare abitrate:number
    declare asamplerate:number
    declare achannel:number

    declare command: string

    public static initial (options: InitOptions) {
        this.init({
            name: {
                type: DataTypes.STRING,
                allowNull: false,
                comment: '编码器名称'
            },
            format: {
                type: DataTypes.STRING,
                allowNull: false,
                comment: '文件格式名称'
            },
            vcodec: {
                type: DataTypes.STRING,
                allowNull: false,
                comment: '视频编码器'
            },
            vwidth: {
                type: DataTypes.SMALLINT.UNSIGNED,
                defaultValue: 0,
                comment: '视频宽'
            },
            vheight: {
                type: DataTypes.SMALLINT.UNSIGNED,
                defaultValue: 0,
                comment: '视频宽'
            },
            vcrf: {
                type: DataTypes.TINYINT.UNSIGNED,
                defaultValue: 0,
                comment: '质量控制'
            },
            vfps: {
                type: DataTypes.TINYINT.UNSIGNED,
                defaultValue: 0,
                comment: '视频帧率'
            },
            vbitrate: {
                type: DataTypes.INTEGER.UNSIGNED,
                defaultValue: 0,
                comment: '视频码率 kbps'
            },
            acodec: {
                type: DataTypes.STRING,
                allowNull: false,
                comment: '视频编码器'
            },
            abitrate: {
                type: DataTypes.SMALLINT.UNSIGNED,
                defaultValue: 0,
                comment: '音频比特率 kbps'
            },
            asamplerate: {
                type: DataTypes.INTEGER.UNSIGNED,
                defaultValue: 0,
                comment: '音频采样率 Hz'
            },
            achannel: {
                type: DataTypes.TINYINT.UNSIGNED,
                defaultValue: 0,
                comment: '音频通道'
            },
            command: {
                type: DataTypes.STRING(511),
                allowNull: true,
                comment: '附加命令，在文件输入后追加'
            }
        }, options)
    }
}

class VideoTask extends Model {
    declare id: number
    declare createdAt: Date
    declare updatedAt: Date

    declare videoFileId: number
    declare videoTranscodeId: number

    declare options: string
    declare status: number

    declare outFile: string
    declare outSize: number

    public static initial (options: InitOptions) {
        this.init({
            videoFileId: {
                type: DataTypes.INTEGER.UNSIGNED,
                allowNull: false,
                comment: '关联文件'
            },
            videoTranscodeId: {
                type: DataTypes.INTEGER.UNSIGNED,
                allowNull: false,
                comment: '关联编码器'
            },
            options: {
                type: DataTypes.STRING,
                allowNull: false,
                comment: 'ffmpeg 参数'
            },
            status: {
                type: DataTypes.INTEGER,
                defaultValue: 0,
                comment: '-1转码失败|0提交中|1转码中|2完成'
            },
            outFile: {
                type: DataTypes.STRING,
                allowNull: true,
                comment: '输出文件路径'
            },
            outSize: {
                type: DataTypes.INTEGER.UNSIGNED,
                defaultValue: 0
            }
        }, options)
    }
}

export {
    VideoFile,
    VideoTranscode,
    VideoTask
}
