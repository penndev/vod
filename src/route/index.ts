import Router from '@koa/router'
import { auth, body } from '../middle/index.js'
import { AdminController, captcha, login, RoleController } from './system.js'
import { VideoFileController, UploadMedia, VideoTranscodeConroller, VideoTaskController, vodDashBoard } from './video.js'
import { ArchiveCategoryController, ArchiveListController, ArchiveTagController } from './archive.js'

const router = new Router()

const routes = (ctx: Router.RouterContext) => {
    const data = []
    for (const item of router.stack) {
        for (const method of item.methods) {
            if (method === 'HEAD') { continue } data.push({ method, path: item.path })
        }
    }
    ctx.body = { data }
}

/**
 * 允许post参数与文件上传
 */
router.use(body)
router.get('/captcha', captcha) // 全局验证码
router.post('/login', login) // 管理员登录

/**
 * 下面所有的接口都需要登录
 */
router.use(auth)

router.get('/dashboard', vodDashBoard)

/**
 * 系统类接口
 */
{
    // 系统管理员操作
    router.get('/system/admin', AdminController.List)
    router.put('/system/admin', AdminController.Update)
    router.post('/system/admin', AdminController.Create)
    router.delete('/system/admin', AdminController.Delete)
    router.get('/system/admin/accesslog', AdminController.AccessLog)
    // 系统角色处理
    router.get('/system/role', RoleController.List)
    router.put('/system/role', RoleController.Update)
    router.post('/system/role', RoleController.Create)
    router.delete('/system/role', RoleController.Delete)
    router.get('/system/role/route', routes)
}

/**
 * 处理媒体类接口
 */
{
    // 原始文件管理
    router.post('/video/upload/before', UploadMedia.Before)
    router.put('/video/upload/part', UploadMedia.Part)
    router.get('/video/file', VideoFileController.List)
    router.put('/video/file', VideoFileController.Update)
    router.delete('/video/file', VideoFileController.Delete)

    // 转码参数配置
    router.post('/video/transcode', VideoTranscodeConroller.Add)
    router.get('/video/transcode', VideoTranscodeConroller.List)
    router.put('/video/transcode', VideoTranscodeConroller.Update)
    router.delete('/video/transcode', VideoTranscodeConroller.Delete)

    // 任务管理配置
    router.post('/video/task', VideoTaskController.Add)
    router.get('/video/task', VideoTaskController.List)
    router.get('/video/task/progress', VideoTaskController.Progress)
}

/**
 * 返回资料接口
 */
{
    // 编辑资料
    router.post('/archive/list', ArchiveListController.Add)
    router.get('/archive/list', ArchiveListController.List)
    router.put('/archive/list', ArchiveListController.Update)
    router.delete('/archive/list', ArchiveListController.Delete)

    router.post('/archive/list/tag', ArchiveListController.AddTag)
    router.delete('/archive/list/tag', ArchiveListController.DeleteTag)
    // 编辑类别
    router.post('/archive/category', ArchiveCategoryController.Add)
    router.get('/archive/category', ArchiveCategoryController.List)
    router.put('/archive/category', ArchiveCategoryController.Update)
    router.delete('/archive/category', ArchiveCategoryController.Delete)

    // 编辑类别
    router.post('/archive/tag', ArchiveTagController.Add)
    router.get('/archive/tag', ArchiveTagController.List)
    router.put('/archive/tag', ArchiveTagController.Update)
    router.delete('/archive/tag', ArchiveTagController.Delete)
}

/**
 * 返回路由
 * @param prefix archive
 * @returns routes
 */
export const adminRoute = (prefix: string) => {
    return router.prefix(prefix).routes()
}
