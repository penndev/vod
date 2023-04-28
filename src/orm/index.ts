import { Sequelize } from 'sequelize'
import config from '../config/index.js'
import { AdminAccesslog, AdminUser, AdminRole, VideoFile, VideoTranscode, VideoTask } from './model.js'

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
  logging: false
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
 * 开发环境自动同步表结构，并进行打印。
 */
if (config.mode === 'dev') {
  await sequelize.sync({ alter: true })
}

export {
  AdminUser,
  AdminRole,
  AdminAccesslog,
  VideoFile,
  VideoTranscode,
  VideoTask
}
