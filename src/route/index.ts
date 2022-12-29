import Router from "@koa/router"
import { auth } from "../middle/index.js"
import { captcha, login } from "./admin.js"
import { mediaList, mediaMpegtsList, mediaUploadBefore, mediaUploadPart } from "./media.js"
import { taskHlsQuery, taskHlsSubmit, taskMpegtsQuery, taskMpegtsSubmit } from "./task.js"

const router = new Router({
    prefix: '/api'
})

// 管理员处理
router.get('/captcha', captcha)
router.post('/login', login)

router.use(auth) //登录中间件

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