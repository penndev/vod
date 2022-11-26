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

    declare filename: string
    declare filepath: string
    declare filemd5: string
    declare filesize: number



    declare videoduration: number
    declare videofps: number
    declare videobitrate: number
    declare videowidth: number
    declare videoheight: number

    declare hlspath: string
    declare hlssize: number
    declare hlskey: string

    public static initial(sequelize: Sequelize) {
        this.init(
            {
                filename: {
                    type: DataTypes.STRING,
                    allowNull: false,
                },
                filepath: {
                    type: DataTypes.STRING,
                    allowNull: true
                },
                filemd5: {
                    type: DataTypes.CHAR(32),
                    allowNull: true
                },
                filesize: {
                    type: DataTypes.INTEGER.UNSIGNED,
                    defaultValue: 0,
                },
                status: {
                    type: DataTypes.TINYINT,
                    defaultValue: 0,
                    comment: '-2转码错误|-1文件错误|0|1文件分析完成|转码成功'
                },
                videoduration: {
                    type: DataTypes.FLOAT.UNSIGNED,
                    defaultValue: 0,
                    comment: '视频时长'
                },
                videofps: {
                    type: DataTypes.TINYINT.UNSIGNED,
                    defaultValue: 0,
                    comment: '视频帧率'
                },
                videobitrate: {
                    type: DataTypes.MEDIUMINT.UNSIGNED,
                    defaultValue: 0,
                    comment: '视频比特率'
                },
                videowidth: {
                    type: DataTypes.SMALLINT.UNSIGNED,
                    defaultValue: 0,
                    comment: '视频宽度'
                },
                videoheight: {
                    type: DataTypes.SMALLINT.UNSIGNED,
                    defaultValue: 0,
                    comment: '视频高度'
                },
                hlspath: {
                    type: DataTypes.STRING,
                    allowNull: true,
                    comment: 'm3u8 path'
                },
                hlssize: {
                    type: DataTypes.INTEGER.UNSIGNED,
                    allowNull: true,
                    comment: 'm3u8 file size'
                },
                hlskey: {
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