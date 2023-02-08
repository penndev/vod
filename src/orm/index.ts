import { Sequelize } from 'sequelize'
import config from '../config/index.js'
import { AdminAccesslog, AdminUser, AdminRole, VideoFile } from './model.js'

const sequelize = new Sequelize(config.dburi,{
    timezone: '+08:00',
    dialectOptions: {
        dateStrings: true,
        typeCast: true
    }
})

// 数据库链接
await sequelize.authenticate()

// 表注册
AdminUser.initial({sequelize, underscored: true })
AdminRole.initial({sequelize, underscored: true })
AdminAccesslog.initial({sequelize, underscored: true })




// MediaTs.initial({sequelize, underscored: true })

// 表关联
// Admin.belongsTo(AdminRole,{
//     constraints: false,
// })

// 表结构同步
if(process.env.NODE_ENV == "dev"){
    await sequelize.sync({ alter: true })
}

export {
    AdminUser,
    AdminRole,
    AdminAccesslog,
    VideoFile,
}