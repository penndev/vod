import Router from "@koa/router"
import { auth } from "../middle/index.js"
import { accessLog, adminCreate, adminDelete, adminList, adminUpdate, captcha, login, roleCreate, roleDelete, roleList, roleUpdate } from "./system.js"
import { mediaList, mediaMpegtsList, mediaUploadBefore, mediaUploadPart } from "./media.js"
import { taskHlsQuery, taskHlsSubmit, taskMpegtsQuery, taskMpegtsSubmit } from "./task.js"

const router = new Router({ prefix: '/api' })

router.get('/captcha', captcha) // 全局验证码
router.post('/login', login) // 管理员登录

router.use(auth)
{
    // 系统管理员操作
    router.get('/system/admin', adminList)
    router.put('/system/admin', adminUpdate)
    router.post('/system/admin', adminCreate)
    router.delete('/system/admin', adminDelete)
    // 系统角色处理
    router.get('/system/role', roleList)
    router.put('/system/role', roleUpdate)
    router.post('/system/role', roleCreate)
    router.delete('/system/role', roleDelete)
    // 管理员访问日志
    router.get('/system/admin/accesslog', accessLog)
}

// 媒体文件处理
router.get('/media/list', mediaList)
router.get('/media/mpegts/list', mediaMpegtsList)
router.post('/media/upload/before', mediaUploadBefore) // 分片上传媒体文件
router.put("/media/upload/part", mediaUploadPart)

// 后台运行的队列任务
router.get('/job/hls/query', taskHlsQuery)
router.post('/job/hls/submit', taskHlsSubmit)
router.get('/job/mpegts/query', taskMpegtsQuery)
router.post('/job/mpegts/submit', taskMpegtsSubmit)

export default router