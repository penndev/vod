import { Sequelize } from 'sequelize'
import config from '../config/index.js'
import { VideoFile, VideoTranscode, VideoTask } from './video.js'
import { ArchiveCategory, ArchiveList, ArchiveTag, ArchiveTagMap } from './archive.js'
import { AdminAccessLog, AdminUser, AdminRole } from './system.js'
/**
 * 数据库连接实例
 * 并对连通性进行测试
 */
const sequelize = new Sequelize(config.dbParse, {
    timezone: '+08:00',
    dialectOptions: {
        dateStrings: true,
        typeCast: true
    },
    logging: config.mode === 'dev' ? false : console.log
})

await sequelize.authenticate()

const initOptions = {
    // 数据库实例
    sequelize,
    // 下划线代替驼峰
    underscored: true,
    // 软删除
    paranoid: true
}

/**
 * 系统管理默认表
 * @param AdminUser 系统管理员
 * @param AdminRole 系统权限
 * @param AdminAccessLog 系统访问日志表
 */
AdminUser.initial(initOptions)
AdminRole.initial(initOptions)
AdminAccessLog.initial(initOptions)
// *** 处理关联联系
AdminUser.belongsTo(AdminRole, { constraints: false })
AdminAccessLog.belongsTo(AdminUser, { constraints: false })

/**
 * 视频管理默认表
 * @param VideoFile 视频源文件
 * @param VideoTranscode ffmpeg编码器
 * @param VideoTask 视频转码列表
 */
VideoFile.initial(initOptions)
VideoTranscode.initial(initOptions)
VideoTask.initial(initOptions)
// *** 处理关联联系
VideoTask.belongsTo(VideoFile, { constraints: false })
VideoTask.belongsTo(VideoTranscode, { constraints: false })

/**
 * 资料管理归档表
 * @param ArchiveList 资料列表
 * @param ArchiveCategory 资料分类
 * @param ArchiveTag 标签表
 * @param ArchiveTagMap 标签资料映射表
 */
ArchiveList.initial(initOptions)
ArchiveCategory.initial(initOptions)
ArchiveTag.initial(initOptions)
ArchiveTagMap.initial(initOptions)
// *** 处理关联联系
ArchiveList.belongsTo(ArchiveCategory, { constraints: false })
ArchiveTagMap.belongsTo(ArchiveTag, { constraints: false })

/**
 * 开发环境自动同步表结构，并进行打印。
 */
if (config.mode === 'dev') {
    await sequelize.sync({ alter: true })
}

export {
    AdminUser,
    AdminRole,
    AdminAccessLog,
    // - 分组
    VideoFile,
    VideoTranscode,
    VideoTask,
    // - 分组
    ArchiveCategory,
    ArchiveList,
    ArchiveTag,
    ArchiveTagMap
}
