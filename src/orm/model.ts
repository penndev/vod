import { Sequelize, DataTypes, Model } from 'sequelize'

class AdminUser extends Model {
    declare id: number
    declare createdAt: Date;
    declare updatedAt: Date;

    declare email: string
    declare passwd: string

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
    declare filePath: string
    declare mediaUri: string
    declare mediaInf: number
    declare fileSize: number
    declare status: number 

    public static initial(sequelize: Sequelize) {
        this.init(
            {
                mediaId: {
                    type: DataTypes.INTEGER.UNSIGNED, 
                },
                filePath: {
                    type: DataTypes.STRING, 
                }, 
                fileSize: {
                    type: DataTypes.INTEGER.UNSIGNED,
                    defaultValue: 0,
                },
                mediaInf:{
                    type:DataTypes.FLOAT.UNSIGNED,
                },
                mediaUri: {
                    type: DataTypes.STRING(255),
                    allowNull: true
                },
                status: {
                    type: DataTypes.TINYINT.UNSIGNED,
                    defaultValue: 0,
                    comment: '0 未处理'
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
    AdminUser,
    Media,
    MediaTs
}