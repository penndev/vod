import Router from "@koa/router"

import { auth, body } from "../middle/index.js"
import { AdminController, captcha, login, RoleController } from "./system.js"
import { MediaController, MediaTsController, UploadMedia } from "./media.js"
import { taskHlsQuery, taskHlsSubmit, taskMpegtsQuery, taskMpegtsSubmit } from "./task.js"

const router = new Router({ prefix: '/api' })

/**
 * 允许post参数与文件上传
 */
router.use(body)

router.get('/captcha', captcha) // 全局验证码
router.post('/login', login)    // 管理员登录
 

/**
 * 下面所有的接口都需要登录
 */
router.use(auth)


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
}

/**
 * 处理媒体类接口
 */
{
    router.post('/media/upload/part', UploadMedia.Before) 
    router.put("/media/upload/part", UploadMedia.Part)

    router.get('/media/list', MediaController.List)
    router.delete('/media/list', MediaController.Delete)

    // 媒体切片
    router.get('/media/mpegts/list', MediaTsController.List)

    // 队列文件校验
    router.get('/job/hls/query', taskHlsQuery)
    router.post('/job/hls/submit', taskHlsSubmit)
    // 队列视频转码
    router.get('/job/mpegts/query', taskMpegtsQuery)
    router.post('/job/mpegts/submit', taskMpegtsSubmit)
}

export default router.routes()