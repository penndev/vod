import { Sequelize, DataTypes, Model } from 'sequelize'

/**
 * 管理员列表
 */
class Admin extends Model {
    declare id: number
    declare createdAt: Date;
    declare updatedAt: Date;
    declare nickname: string
    declare email: string
    declare passwd: string
    declare status: number

    public static initial(sequelize: Sequelize) {
        this.init(
            {
                email: {
                    type: DataTypes.STRING,
                    allowNull: false
                },
                passwd: {
                    type: DataTypes.STRING,
                    allowNull: false
                },
                nickname: {
                    type: DataTypes.STRING,
                    allowNull: false
                },
                status: {
                    type: DataTypes.INTEGER.UNSIGNED,
                    defaultValue: 0,
                    comment: '0禁止登录 | 1允许登录'
                },
            },
            {
                sequelize,
                underscored: true
            }
        )
    }
}

class AdminAccessLog extends Model {
    declare id: number
    declare createdAt: Date;
    declare updatedAt: Date;

    declare admin: number // request auth user
    declare method: string // http request method
    declare path: string // http request url
    declare payload: string //requets param or body
    declare ip: string 

    public static initial(sequelize: Sequelize) {
        this.init(
            {
                admin: {
                    type: DataTypes.INTEGER.UNSIGNED,
                },
                ip:{
                    type: DataTypes.STRING,
                    comment:'管理员操作IP地址'
                },
                method:{
                    type: DataTypes.STRING,
                    comment:'请求方法'
                },
                path: {
                    type: DataTypes.STRING,
                    comment:'请求地址'
                },
                payload: {
                    type: DataTypes.STRING,
                    comment:'请求体'
                },
                status: {
                    type: DataTypes.INTEGER.UNSIGNED,
                    comment:'http 响应状态码'
                }
            },
            {
                sequelize,
                underscored: true
            }
        )
    }
}

class Media extends Model {
    declare id: number
    declare createdAt: Date;
    declare updatedAt: Date;

    declare fileName: string
    declare filePath: string
    declare fileMd5: string
    declare fileSize: number

    declare status: number

    declare videoDuration: number
    declare videoFps: number
    declare videoBitrate: number
    declare videoWidth: number
    declare videoHeight: number

    declare hlsPath: string
    declare hlsKey: string

    public static initial(sequelize: Sequelize) {
        this.init(
            {
                fileName: {
                    type: DataTypes.STRING,
                    allowNull: false,
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
                    defaultValue: 0,
                },
                status: {
                    type: DataTypes.TINYINT,
                    defaultValue: 0,
                    comment: '-2转码错误|-1文件错误|0|1文件分析完成|转码成功'
                },
                videoDuration: {
                    type: DataTypes.FLOAT.UNSIGNED,
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
            {
                sequelize,
                underscored: true
            }
        )
    }
}


class MediaTs extends Model {
    declare id: number
    declare createdAt: Date
    declare updatedAt: Date

    declare mediaId: number
    declare status: number

    declare tsPath: string
    declare tsSize: number
    declare tsSeq: number
    declare tsExtinf: number
    declare uploadUri: string

    public static initial(sequelize: Sequelize) {
        this.init(
            {
                mediaId: {
                    type: DataTypes.INTEGER.UNSIGNED,
                },
                status: {
                    type: DataTypes.TINYINT.UNSIGNED,
                    defaultValue: 0,
                    comment: '0 未处理'
                },
                tsPath: {
                    type: DataTypes.STRING,
                },
                tsSize: {
                    type: DataTypes.INTEGER.UNSIGNED,
                    defaultValue: 0,
                },
                tsSeq: {
                    type: DataTypes.INTEGER.UNSIGNED,
                },
                tsExtinf: {
                    type: DataTypes.FLOAT.UNSIGNED,
                },
                uploadUri: {
                    type: DataTypes.STRING,
                    allowNull: true
                },
            },
            {
                sequelize,
                underscored: true
            }
        )
    }
}

export {
    Admin,
    AdminAccessLog,
    Media,
    MediaTs,
}