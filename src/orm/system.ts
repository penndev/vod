import { DataTypes, Model, InitOptions } from 'sequelize'

/**
 * 管理员列表
 */
class AdminUser extends Model {
    declare id: number
    declare createdAt: Date
    declare updatedAt: Date
    declare nickname: string
    declare email: string
    declare passwd: string
    declare status: number

    declare adminRoleId: number

    // 结构体
    static initial (options: InitOptions) {
        AdminUser.init(
            {
                email: {
                    type: DataTypes.STRING,
                    allowNull: false
                },
                passwd: {
                    type: DataTypes.STRING,
                    allowNull: false
                },
                nickname: {
                    type: DataTypes.STRING,
                    allowNull: false
                },
                status: {
                    type: DataTypes.INTEGER.UNSIGNED,
                    defaultValue: 0,
                    comment: '0禁止登录 | 1允许登录'
                },
                adminRoleId: {
                    type: DataTypes.INTEGER.UNSIGNED,
                    allowNull: false,
                    comment: '0超级管理员'
                }
            }, options
        )
    }
}

/**
 * 角色列表
 */
class AdminRole extends Model {
    declare id: number
    declare createdAt: Date
    declare updatedAt: Date
    declare name: string
    declare status: number
    declare menu: string[]
    declare route: {method:string, path:string}[] // [{path:'admin/list'},]
    public static initial (options: InitOptions) {
        this.init(
            {
                name: {
                    type: DataTypes.STRING,
                    allowNull: false
                },
                status: {
                    type: DataTypes.INTEGER.UNSIGNED,
                    defaultValue: 0,
                    comment: '0禁止登录 | 1允许登录'
                },
                menu: {
                    type: DataTypes.JSON,
                    comment: '返回给前端展示的路由组 json[]'
                },
                route: {
                    type: DataTypes.JSON,
                    comment: '接口用户鉴权允许的路由组 json[]'
                }
            },
            options
        )
    }
}

/**
 * 权限访问日志
 */
class AdminAccessLog extends Model {
    declare id: number
    declare createdAt: Date
    declare updatedAt: Date

    declare adminUserId: number // request auth user
    declare method: string // http request method
    declare path: string // http request url
    declare payload: string // requets param or body
    declare ip: string

    public static initial (options: InitOptions) {
        this.init(
            {
                adminUserId: {
                    type: DataTypes.INTEGER.UNSIGNED
                },
                ip: {
                    type: DataTypes.STRING,
                    comment: '管理员操作IP地址'
                },
                method: {
                    type: DataTypes.STRING,
                    comment: '请求方法'
                },
                path: {
                    type: DataTypes.STRING,
                    comment: '请求地址'
                },
                payload: {
                    type: DataTypes.TEXT,
                    comment: '请求体'
                },
                status: {
                    type: DataTypes.INTEGER.UNSIGNED,
                    comment: 'http 响应状态码'
                }
            },
            options
        )
    }
}

export {
    AdminUser,
    AdminRole,
    AdminAccessLog
}
