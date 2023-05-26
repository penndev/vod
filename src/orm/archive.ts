import { DataTypes, Model, InitOptions } from 'sequelize'

/**
 * 资料标签表
 */
export class ArchiveTag extends Model {
  declare id: number
  declare createdAt: Date
  declare updatedAt: Date
  declare status: number
  declare name: string // 名称
  declare content: string // 简介
  declare hits: number // 热度

  public static initial (options: InitOptions) {
    this.init(
      {
        status: {
          type: DataTypes.TINYINT,
          defaultValue: 0,
          comment: '1上架, 0下架'
        },
        name: {
          type: DataTypes.STRING,
          allowNull: false
        },
        content: {
          type: DataTypes.TEXT('medium'),
          comment: '简介'
        },
        hit: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          defaultValue: 0,
          comment: '热度'
        }
      },
      options
    )
  }
}

/**
 * 资料标签映射表
 */
export class ArchiveTagMap extends Model {
  declare id: number
  declare createdAt: Date
  declare updatedAt: Date

  declare archiveTagId: number
  declare archiveListId: number
  declare order: number // 排序

  public static initial (options: InitOptions) {
    this.init(
      {
        archiveTagId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          comment: '关联的分类ID'
        },
        archiveListId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          comment: '关联的分类ID'
        },
        order: {
          type: DataTypes.INTEGER,
          defaultValue: 0,
          comment: '排序'
        }
      },
      options
    )
  }
}

/**
 * 资料分类表
 */
export class ArchiveCategory extends Model {
  declare id: number
  declare createdAt: Date
  declare updatedAt: Date
  declare parent: number // 所属父级分类
  declare status: number
  declare name: string // 名称
  declare content: string // 简介
  declare order: number // 播放量

  public static initial (options: InitOptions) {
    this.init(
      {
        parent: {
          type: DataTypes.INTEGER,
          defaultValue: 0,
          allowNull: false,
          comment: '父级ID 0是顶级分类'
        },
        status: {
          type: DataTypes.TINYINT,
          defaultValue: 0,
          comment: '1上架, 0下架'
        },
        name: {
          type: DataTypes.STRING,
          allowNull: false
        },
        content: {
          type: DataTypes.TEXT('medium'),
          comment: '简介'
        },
        order: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 99,
          comment: '排序，从小到大'
        }
      },
      options
    )
  }
}

/**
 * 资料数据表
 */
export class ArchiveList extends Model {
  declare id: number
  declare createdAt: Date
  declare updatedAt: Date
  declare status: number
  declare archiveCategoryId: number // 所属分类

  declare name: string // 名称
  declare sub: string // 子主题
  declare pic: string // 封面
  declare total: number // 总集数
  declare area: string // 区域
  declare lang: string // 语言
  declare year: number // 年份
  declare content: string // 简介
  declare remark: string // 标记（正片 36集全）
  declare up: number // 点赞
  declare down: number // 点踩
  declare hits: number // 播放量

  public static initial (options: InitOptions) {
    this.init(
      {
        archiveCategoryId: {
          type: DataTypes.INTEGER,
          comment: '关联的分类ID'
        },
        status: {
          type: DataTypes.TINYINT,
          defaultValue: 0,
          comment: '1上架, 0下架'
        },
        name: {
          type: DataTypes.STRING,
          allowNull: false
        },
        sub: {
          type: DataTypes.STRING,
          allowNull: true
        },
        pic: {
          type: DataTypes.STRING,
          allowNull: false,
          defaultValue: ''
        },
        total: {
          type: DataTypes.MEDIUMINT.UNSIGNED,
          allowNull: false,
          defaultValue: 1
        },
        area: {
          type: DataTypes.STRING
        },
        lang: {
          type: DataTypes.STRING
        },
        year: {
          type: DataTypes.MEDIUMINT.UNSIGNED
        },
        content: {
          type: DataTypes.TEXT('medium'),
          comment: '简介'
        },
        remark: {
          type: DataTypes.STRING,
          comment: '标记（正片 36集全）'
        },
        up: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          defaultValue: 0,
          comment: '点赞'
        },
        down: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          defaultValue: 0,
          comment: '点踩'
        },
        hits: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          defaultValue: 0,
          comment: '播放量'
        }
      },
      options
    )
  }
}
