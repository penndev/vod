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

await sequelize.authenticate()

Admin.initial( sequelize )
Role.initial( sequelize )
AdminAccessLog.initial( sequelize )
Media.initial( sequelize )
MediaTs.initial( sequelize )

// 创建表
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