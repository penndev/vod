import { Sequelize } from 'sequelize'
import config from '../config/index.js'
import { VideoFile, VideoTranscode, VideoTask } from './video.js'
import { ArchiveCategory, ArchiveList, ArchiveTag, ArchiveTagMap } from './archive.js'
import { AdminAccesslog, AdminUser, AdminRole } from './system.js'
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
    logging: config.mode === 'dev'
})
await sequelize.authenticate()

/**
 * 系统管理默认表
 * @param AdminUser 系统管理员
 * @param AdminRole 系统权限
 * @param AdminAccesslog 系统访问日志表
 */
AdminUser.initial({ sequelize, underscored: true })
AdminRole.initial({ sequelize, underscored: true })
AdminAccesslog.initial({ sequelize, underscored: true })
// *** 处理关联联系
AdminUser.belongsTo(AdminRole, { constraints: false })
AdminAccesslog.belongsTo(AdminUser, { constraints: false })

/**
 * 视频管理默认表
 * @param VideoFile 视频源文件
 * @param VideoTranscode ffmpeg编码器
 * @param VideoTask 视频转码列表
 */
VideoFile.initial({ sequelize, underscored: true })
VideoTranscode.initial({ sequelize, underscored: true })
VideoTask.initial({ sequelize, underscored: true })
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
ArchiveList.initial({ sequelize, underscored: true })
ArchiveCategory.initial({ sequelize, underscored: true })
ArchiveTag.initial({ sequelize, underscored: true })
ArchiveTagMap.initial({ sequelize, underscored: true })
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
    AdminAccesslog,
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
