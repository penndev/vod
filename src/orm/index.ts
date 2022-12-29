import { Sequelize } from 'sequelize'
import config from '../config/index.js'
import { AdminUser, Media, MediaTs } from './model.js'

const sequelize = new Sequelize(config.dburi,{
    timezone: '+08:00',
    dialectOptions: {
        dateStrings: true,
        typeCast: true
    },
})

await sequelize.authenticate()

AdminUser.initial( sequelize )
Media.initial( sequelize )
MediaTs.initial( sequelize )

// 创建表
if(process.env.NODE_ENV == "dev"){
    await sequelize.sync({ alter: true })
}

export {
    AdminUser,
    Media,
    MediaTs,
}