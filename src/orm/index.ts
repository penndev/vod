import { Sequelize } from 'sequelize'
import config from '#config/index.js'
import { AdminUser, Media } from './model.js'

const sequelize = new Sequelize(config.dburi)
await sequelize.authenticate()

AdminUser.initial( sequelize )
Media.initial( sequelize )

// 创建表
await sequelize.sync({ alter: true })

export {
    AdminUser,
    Media,
}