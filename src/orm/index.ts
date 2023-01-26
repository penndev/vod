import { Sequelize } from 'sequelize'
import config from '../config/index.js'
import { AdminAccessLog, Admin, Media, MediaTs, Role } from './model.js'

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
Admin.initial({sequelize, underscored: true })
Role.initial({sequelize, underscored: true })
AdminAccessLog.initial({sequelize, underscored: true })

Media.initial({
    sequelize, 
    underscored: true, //下划线命名
    paranoid: true,    //安全删除
})

MediaTs.initial({sequelize, underscored: true })

// 表关联
// Admin.belongsTo(Role,{
//     constraints: false,
// })

// 表结构同步
if(process.env.NODE_ENV == "dev"){
    await sequelize.sync({ alter: true })
}

export {
    Admin,
    Role,
    AdminAccessLog,
    Media,
    MediaTs,
}